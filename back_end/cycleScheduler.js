import express from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import moduleQueue from './queues/moduleQueue.js';
import notificationQueue from './queues/notificationQueue.js';
import { authenticateTokenAdmin, connection } from './app.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/New_York';

export const cycleRouter = express.Router();

// ── Preset defaults ────────────────────────────────────────────────
const PRESET_DEFAULTS = {
  quick_test: {
    open_to_processing_hours: 2 / 60,        // 2 minutes
    processing_to_completed_hours: 2 / 60,    // 2 minutes
    auto_repeat: false,
  },
  extended_test: {
    open_to_processing_hours: 0.5,            // 30 minutes
    processing_to_completed_hours: 0.5,       // 30 minutes
    auto_repeat: false,
  },
  normal: {
    open_to_processing_hours: 72,             // 3 days
    processing_to_completed_hours: 42,        // 1.75 days
    auto_repeat: true,
  },
};

// ── GET config ─────────────────────────────────────────────────────
cycleRouter.get('/config/:workshopId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const [rows] = await connection.query(
      'SELECT * FROM cycle_configs WHERE workshop_id = ? ORDER BY updated_at DESC LIMIT 1',
      [workshopId]
    );
    if (rows.length === 0) {
      return res.status(200).json({ config: null, presetDefaults: PRESET_DEFAULTS });
    }
    return res.status(200).json({ config: rows[0], presetDefaults: PRESET_DEFAULTS });
  } catch (err) {
    console.error('GET cycle config error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── PUT config (save / update) ─────────────────────────────────────
cycleRouter.put('/config/:workshopId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const {
      preset = 'normal',
      start_day = 3,
      start_hour = 7,
      open_to_processing_hours,
      processing_to_completed_hours,
    } = req.body;

    const defaults = PRESET_DEFAULTS[preset] || PRESET_DEFAULTS.normal;
    const otpH = open_to_processing_hours ?? defaults.open_to_processing_hours;
    const ptcH = processing_to_completed_hours ?? defaults.processing_to_completed_hours;
    const autoRepeat = defaults.auto_repeat;

    // Upsert
    const [existing] = await connection.query(
      'SELECT cycle_config_id FROM cycle_configs WHERE workshop_id = ? LIMIT 1',
      [workshopId]
    );

    if (existing.length > 0) {
      await connection.execute(
        `UPDATE cycle_configs
         SET preset = ?, start_day = ?, start_hour = ?,
             open_to_processing_hours = ?, processing_to_completed_hours = ?,
             auto_repeat = ?
         WHERE cycle_config_id = ?`,
        [preset, start_day, start_hour, otpH, ptcH, autoRepeat, existing[0].cycle_config_id]
      );
    } else {
      await connection.execute(
        `INSERT INTO cycle_configs
           (workshop_id, preset, start_day, start_hour,
            open_to_processing_hours, processing_to_completed_hours, auto_repeat)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [workshopId, preset, start_day, start_hour, otpH, ptcH, autoRepeat]
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('PUT cycle config error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST start cycle ───────────────────────────────────────────────
cycleRouter.post('/start/:workshopId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopId } = req.params;

    // 1. Load config
    const [cfgRows] = await connection.query(
      'SELECT * FROM cycle_configs WHERE workshop_id = ? LIMIT 1',
      [workshopId]
    );
    if (cfgRows.length === 0) {
      return res.status(400).json({ error: 'No cycle config found. Save a config first.' });
    }
    const cfg = cfgRows[0];

    // 2. Get pending modules
    const [pendingModules] = await connection.query(
      'SELECT workshop_module_id, workshop_module_name FROM workshop_modules WHERE workshop_id = ? AND workshop_module_status = "pending"',
      [workshopId]
    );
    if (pendingModules.length === 0) {
      return res.status(400).json({ error: 'No pending modules found for this workshop.' });
    }

    // 3. Validation: every pending module must have at least one prompt
    const moduleIds = pendingModules.map(m => m.workshop_module_id);
    const [promptCounts] = await connection.query(
      `SELECT wp.workshop_module_id AS module_id, COUNT(*) AS cnt
       FROM workshop_prompts wp
       WHERE wp.workshop_module_id IN (?)
       GROUP BY wp.workshop_module_id`,
      [moduleIds]
    );
    const promptMap = new Map(promptCounts.map(r => [r.module_id, r.cnt]));
    const missing = pendingModules.filter(m => !promptMap.has(m.workshop_module_id));

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Some modules are missing prompts',
        modules: missing.map(m => ({
          module_id: m.workshop_module_id,
          module_name: m.workshop_module_name,
        })),
      });
    }

    // 4. Cancel-and-replace: remove any existing pending jobs for this workshop
    await cancelExistingJobs(workshopId);

    // 5. Compute schedule timestamps
    const now = dayjs().tz(TZ);
    let openAt;

    if (cfg.preset === 'normal') {
      // Next occurrence of start_day at start_hour
      openAt = getNextOccurrence(now, cfg.start_day, cfg.start_hour);
    } else {
      // Test presets: start immediately
      openAt = now;
    }

    const processingAt = openAt.add(Number(cfg.open_to_processing_hours), 'hour');
    const completedAt = processingAt.add(Number(cfg.processing_to_completed_hours), 'hour');

    // 6. Enqueue jobs for each module
    const jobRecords = [];
    for (const mod of pendingModules) {
      const mid = mod.workshop_module_id;

      const openDelay = Math.max(0, openAt.diff(dayjs(), 'millisecond'));
      const procDelay = Math.max(0, processingAt.diff(dayjs(), 'millisecond'));
      const compDelay = Math.max(0, completedAt.diff(dayjs(), 'millisecond'));

      const openJob = await moduleQueue.add('openModule', { moduleId: mid, workshopId: Number(workshopId) }, { delay: openDelay });
      const procJob = await moduleQueue.add('processModule', { moduleId: mid, workshopId: Number(workshopId) }, { delay: procDelay });
      const compJob = await moduleQueue.add('completeModule', { moduleId: mid, workshopId: Number(workshopId) }, { delay: compDelay });

      // Schedule last-day reminder ~12s before processing starts
      const reminderDelay = Math.max(0, procDelay - 12000);
      await notificationQueue.add('lastDayReminder', { moduleId: mid, workshopId: Number(workshopId) }, { delay: reminderDelay });

      jobRecords.push(
        [workshopId, mid, openJob.id, 'openModule', openAt.toDate(), 'pending'],
        [workshopId, mid, procJob.id, 'processModule', processingAt.toDate(), 'pending'],
        [workshopId, mid, compJob.id, 'completeModule', completedAt.toDate(), 'pending'],
      );
    }

    // 7. Persist job records
    if (jobRecords.length > 0) {
      await connection.query(
        `INSERT INTO cycle_jobs (workshop_id, module_id, bullmq_job_id, job_name, scheduled_for, status)
         VALUES ?`,
        [jobRecords]
      );
    }

    // 8. Mark config active
    await connection.execute(
      'UPDATE cycle_configs SET active = TRUE WHERE cycle_config_id = ?',
      [cfg.cycle_config_id]
    );

    return res.status(200).json({
      ok: true,
      schedule: {
        openAt: openAt.toISOString(),
        processingAt: processingAt.toISOString(),
        completedAt: completedAt.toISOString(),
      },
      modulesScheduled: pendingModules.length,
    });
  } catch (err) {
    console.error('POST cycle start error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST cancel cycle ──────────────────────────────────────────────
cycleRouter.post('/cancel/:workshopId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const cancelled = await cancelExistingJobs(workshopId);

    await connection.execute(
      'UPDATE cycle_configs SET active = FALSE WHERE workshop_id = ?',
      [workshopId]
    );

    return res.status(200).json({ ok: true, cancelledJobs: cancelled });
  } catch (err) {
    console.error('POST cycle cancel error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── GET cycle status ───────────────────────────────────────────────
cycleRouter.get('/status/:workshopId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopId } = req.params;

    const [jobs] = await connection.query(
      `SELECT cj.*, wm.workshop_module_name
       FROM cycle_jobs cj
       JOIN workshop_modules wm ON cj.module_id = wm.workshop_module_id
       WHERE cj.workshop_id = ? AND cj.status = 'pending'
       ORDER BY cj.scheduled_for ASC`,
      [workshopId]
    );

    const [cfgRows] = await connection.query(
      'SELECT * FROM cycle_configs WHERE workshop_id = ? LIMIT 1',
      [workshopId]
    );

    return res.status(200).json({
      config: cfgRows[0] || null,
      pendingJobs: jobs,
    });
  } catch (err) {
    console.error('GET cycle status error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── GET validation check (modules with/without prompts) ────────────
cycleRouter.get('/validate/:workshopId', authenticateTokenAdmin, async (req, res) => {
  try {
    const { workshopId } = req.params;

    const [modules] = await connection.query(
      `SELECT wm.workshop_module_id, wm.workshop_module_name, wm.workshop_module_status,
              COUNT(wp.workshop_prompt_id) AS prompt_count
       FROM workshop_modules wm
       LEFT JOIN workshop_prompts wp ON wm.workshop_module_id = wp.workshop_module_id
       WHERE wm.workshop_id = ?
       GROUP BY wm.workshop_module_id`,
      [workshopId]
    );

    return res.status(200).json({ modules });
  } catch (err) {
    console.error('GET cycle validate error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Cancel all pending BullMQ jobs for a workshop and mark them cancelled in DB.
 */
async function cancelExistingJobs(workshopId) {
  const [pendingJobs] = await connection.query(
    'SELECT bullmq_job_id FROM cycle_jobs WHERE workshop_id = ? AND status = "pending"',
    [workshopId]
  );

  let cancelled = 0;
  for (const row of pendingJobs) {
    try {
      const job = await moduleQueue.getJob(row.bullmq_job_id);
      if (job) {
        await job.remove();
        cancelled++;
      }
    } catch (e) {
      console.warn(`Could not remove BullMQ job ${row.bullmq_job_id}:`, e.message);
    }
  }

  if (pendingJobs.length > 0) {
    await connection.execute(
      'UPDATE cycle_jobs SET status = "cancelled" WHERE workshop_id = ? AND status = "pending"',
      [workshopId]
    );
  }

  return cancelled;
}

/**
 * Compute the next occurrence of a given day-of-week and hour in ET.
 * If today is that day but the hour hasn't passed, returns today.
 * dayOfWeek: 0=Sunday..6=Saturday
 */
function getNextOccurrence(now, dayOfWeek, hour) {
  let target = now.day(dayOfWeek).hour(hour).minute(0).second(0).millisecond(0);

  // If the computed day is in the past (or right now), advance to next week
  if (target.isBefore(now) || target.isSame(now)) {
    target = target.add(7, 'day');
  }

  return target;
}

