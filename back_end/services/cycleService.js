/**
 * Standalone cycle-scheduling logic used by the moduleWorker for auto-repeat.
 *
 * This file intentionally does NOT import from app.js to avoid the circular
 * dependency: worker → cycleScheduler → app → cycleScheduler.
 * It creates its own lightweight DB pool instead.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import moduleQueue from '../queues/moduleQueue.js';
import notificationQueue from '../queues/notificationQueue.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/New_York';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
});

/**
 * Compute the next occurrence of a given day-of-week and hour in ET.
 * dayOfWeek: 0=Sunday..6=Saturday
 */
function getNextOccurrence(now, dayOfWeek, hour) {
  let target = now.day(dayOfWeek).hour(hour).minute(0).second(0).millisecond(0);
  if (target.isBefore(now) || target.isSame(now)) {
    target = target.add(7, 'day');
  }
  return target;
}

/**
 * Schedule the next weekly cycle for a workshop (auto-repeat).
 * Called by moduleWorker when all modules in a workshop reach completed.
 */
export async function scheduleNextCycle(workshopId) {
  const [cfgRows] = await db.query(
    'SELECT * FROM cycle_configs WHERE workshop_id = ? AND auto_repeat = TRUE LIMIT 1',
    [workshopId]
  );
  if (cfgRows.length === 0) return;
  const cfg = cfgRows[0];

  // Check for pending modules
  const [pendingModules] = await db.query(
    'SELECT workshop_module_id FROM workshop_modules WHERE workshop_id = ? AND workshop_module_status = "pending"',
    [workshopId]
  );
  if (pendingModules.length === 0) return;

  // Validate prompts exist
  const moduleIds = pendingModules.map(m => m.workshop_module_id);
  const [promptCounts] = await db.query(
    `SELECT wp.workshop_module_id AS module_id, COUNT(*) AS cnt
     FROM workshop_prompts wp
     WHERE wp.workshop_module_id IN (?)
     GROUP BY wp.workshop_module_id`,
    [moduleIds]
  );
  const promptMap = new Map(promptCounts.map(r => [r.module_id, r.cnt]));
  const allHavePrompts = pendingModules.every(m => promptMap.has(m.workshop_module_id));

  if (!allHavePrompts) {
    console.warn(`Auto-repeat skipped for workshop ${workshopId}: some modules missing prompts`);
    return;
  }

  const now = dayjs().tz(TZ);
  const openAt = getNextOccurrence(now, cfg.start_day, cfg.start_hour);
  const processingAt = openAt.add(Number(cfg.open_to_processing_hours), 'hour');
  const completedAt = processingAt.add(Number(cfg.processing_to_completed_hours), 'hour');

  const jobRecords = [];
  for (const mod of pendingModules) {
    const mid = mod.workshop_module_id;
    const openDelay = Math.max(0, openAt.diff(dayjs(), 'millisecond'));
    const procDelay = Math.max(0, processingAt.diff(dayjs(), 'millisecond'));
    const compDelay = Math.max(0, completedAt.diff(dayjs(), 'millisecond'));

    const openJob = await moduleQueue.add('openModule', { moduleId: mid, workshopId }, { delay: openDelay });
    const procJob = await moduleQueue.add('processModule', { moduleId: mid, workshopId }, { delay: procDelay });
    const compJob = await moduleQueue.add('completeModule', { moduleId: mid, workshopId }, { delay: compDelay });

    // Schedule last-day reminder ~12s before processing starts
    const reminderDelay = Math.max(0, procDelay - 12000);
    await notificationQueue.add('lastDayReminder', { moduleId: mid, workshopId }, { delay: reminderDelay });

    jobRecords.push(
      [workshopId, mid, openJob.id, 'openModule', openAt.toDate(), 'pending'],
      [workshopId, mid, procJob.id, 'processModule', processingAt.toDate(), 'pending'],
      [workshopId, mid, compJob.id, 'completeModule', completedAt.toDate(), 'pending'],
    );
  }

  if (jobRecords.length > 0) {
    await db.query(
      `INSERT INTO cycle_jobs (workshop_id, module_id, bullmq_job_id, job_name, scheduled_for, status)
       VALUES ?`,
      [jobRecords]
    );
  }

  console.log(`Auto-repeat: scheduled next cycle for workshop ${workshopId}, opening at ${openAt.toISOString()}`);
}
