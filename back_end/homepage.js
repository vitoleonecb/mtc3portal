import express from 'express';
import { connection } from './app.js';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import notificationQueue from './queues/notificationQueue.js';

export const homepageRouter = express.Router();

const SALT_ROUNDS = 10;

// Rate limiter for the public batch response endpoint
const responseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP. Please try again later.' },
});

/**
 * GET /api/homepage/feed
 *
 * Public (no auth). Returns everything the dynamic homepage needs:
 *   - currentWorkshop  – the workshop with open modules
 *   - openModules      – all open modules with their full prompt lists
 *   - firstPromptPath  – convenience path for logged-in CTA
 *   - recentResponses  – privacy-safe snippets for the typewriter ticker
 *   - communityStats   – aggregate counts for social proof
 *   - sampleAnalytics  – chart-ready data for the analytics showcase
 */
homepageRouter.get('/feed', async (_req, res) => {
  try {
    // ---------- Current Workshop + Open Modules + Prompts ----------
    const [workshopRows] = await connection.query(`
      SELECT DISTINCT w.workshop_id, w.workshop_name, w.workshop_description,
             w.workshop_date, w.workshop_location
      FROM workshops w
      JOIN workshop_modules wm ON w.workshop_id = wm.workshop_id
      WHERE wm.workshop_module_status = 'open'
      ORDER BY w.workshop_id DESC
      LIMIT 1
    `);

    let currentWorkshop = null;
    let openModules = [];
    let firstPromptPath = null;

    if (workshopRows.length) {
      const ws = workshopRows[0];
      currentWorkshop = {
        workshopId: ws.workshop_id,
        workshopName: ws.workshop_name,
        workshopDescription: ws.workshop_description,
        workshopDate: ws.workshop_date,
        workshopLocation: ws.workshop_location,
      };

      // Fetch all open modules for this workshop
      const [moduleRows] = await connection.query(`
        SELECT wm.workshop_module_id, wm.workshop_module_name, wm.workshop_module_status
        FROM workshop_modules wm
        WHERE wm.workshop_id = ? AND wm.workshop_module_status = 'open'
        ORDER BY wm.workshop_module_id ASC
      `, [ws.workshop_id]);

      // Fetch all prompts for these modules in one query
      const moduleIds = moduleRows.map(m => m.workshop_module_id);
      let promptRows = [];
      if (moduleIds.length) {
        [promptRows] = await connection.query(`
          SELECT wp.workshop_prompt_id, wp.workshop_module_id,
                 wp.prompt_template_id, wp.workshop_prompt_options,
                 wp.workshop_prompt_reference
          FROM workshop_prompts wp
          WHERE wp.workshop_module_id IN (?)
          ORDER BY wp.workshop_prompt_id ASC
        `, [moduleIds]);
      }

      // Group prompts by module
      const promptsByModule = {};
      for (const p of promptRows) {
        if (!promptsByModule[p.workshop_module_id]) {
          promptsByModule[p.workshop_module_id] = [];
        }
        let opts = p.workshop_prompt_options;
        if (typeof opts === 'string') {
          try { opts = JSON.parse(opts); } catch { /* keep as-is */ }
        }
        promptsByModule[p.workshop_module_id].push({
          promptId: p.workshop_prompt_id,
          templateId: p.prompt_template_id,
          options: opts,
          reference: p.workshop_prompt_reference,
        });
      }

      openModules = moduleRows.map(m => ({
        moduleId: m.workshop_module_id,
        moduleName: m.workshop_module_name,
        moduleStatus: m.workshop_module_status,
        prompts: promptsByModule[m.workshop_module_id] || [],
      }));

      // Build convenience path for logged-in CTA
      if (openModules.length && openModules[0].prompts.length) {
        const firstMod = openModules[0];
        const firstPrompt = firstMod.prompts[0];
        firstPromptPath = `/workshops/${ws.workshop_id}/modules/${firstMod.moduleId}/prompts/${firstPrompt.promptId}`;
      }
    }

    // ---------- Recent Responses (typewriter ticker) ----------
    const [recentRows] = await connection.query(`
      SELECT
        u.first_name,
        wr.workshop_response_content,
        wr.workshop_response_created
      FROM workshop_responses wr
      JOIN users u ON wr.user_id = u.user_id
      JOIN workshop_prompts wp ON wr.workshop_prompt_id = wp.workshop_prompt_id
      WHERE wr.workshop_response_acceptance = 1
        AND wp.prompt_template_id IN (4, 8)
      ORDER BY wr.workshop_response_created DESC
      LIMIT 30
    `);

    const recentResponses = recentRows.map((r) => {
      let text = '';
      try {
        const parsed = typeof r.workshop_response_content === 'string'
          ? JSON.parse(r.workshop_response_content)
          : r.workshop_response_content;

        if (Array.isArray(parsed)) {
          text = parsed.map((q) => q.answer || q.notationResponse || '').join(' ').trim();
        } else if (parsed && typeof parsed === 'object') {
          text = parsed.notationResponse || parsed.answer || '';
        } else {
          text = String(parsed || '');
        }
      } catch {
        text = String(r.workshop_response_content || '');
      }
      if (text.length > 140) text = text.slice(0, 137) + '…';

      return {
        name: r.first_name,
        text,
        created: r.workshop_response_created,
      };
    }).filter((r) => r.text.length > 0);

    // ---------- Community Stats ----------
    const [[{ totalResponses }]] = await connection.query(
      'SELECT COUNT(*) AS totalResponses FROM workshop_responses'
    );
    const [[{ totalUsers }]] = await connection.query(
      'SELECT COUNT(*) AS totalUsers FROM users'
    );
    const [[{ totalWorkshops }]] = await connection.query(
      'SELECT COUNT(*) AS totalWorkshops FROM workshops'
    );

    const communityStats = {
      totalResponses: Number(totalResponses),
      totalUsers: Number(totalUsers),
      totalWorkshops: Number(totalWorkshops),
    };

    // ---------- Sample Analytics ----------
    const [topPromptRows] = await connection.query(`
      SELECT wp.workshop_prompt_id, wp.prompt_template_id, COUNT(*) AS cnt
      FROM workshop_responses wr
      JOIN workshop_prompts wp ON wr.workshop_prompt_id = wp.workshop_prompt_id
      WHERE wr.workshop_response_acceptance = 1
        AND wp.prompt_template_id IN (1, 3, 9)
      GROUP BY wp.workshop_prompt_id
      ORDER BY cnt DESC
      LIMIT 1
    `);

    let sampleAnalytics = null;
    if (topPromptRows.length) {
      const { workshop_prompt_id: samplePromptId, prompt_template_id: sampleTemplateId } = topPromptRows[0];

      const [sampleRows] = await connection.query(
        `SELECT workshop_response_content, workshop_response_created
         FROM workshop_responses
         WHERE workshop_prompt_id = ? AND workshop_response_acceptance = 1`,
        [samplePromptId]
      );

      const questions = {};
      const timeSeries = {};

      sampleRows.forEach((row) => {
        let content = row.workshop_response_content;
        if (typeof content === 'string') {
          try { content = JSON.parse(content); } catch { return; }
        }
        if (!Array.isArray(content)) return;

        content.forEach((item, qIndex) => {
          if (!questions[qIndex]) {
            questions[qIndex] = {
              questionText: item.questionText || `Question ${qIndex + 1}`,
              totalResponses: 0,
              options: {},
            };
          }
          questions[qIndex].totalResponses++;

          if (item.optionLabel || item.answer) {
            const label = (item.optionLabel || item.answer || '').trim();
            if (label) {
              if (!questions[qIndex].options[label]) {
                questions[qIndex].options[label] = { optionText: label, count: 0 };
              }
              questions[qIndex].options[label].count++;
            }
          }

          if (Array.isArray(item.options)) {
            item.options.forEach((opt) => {
              if (!opt || !opt.optionText) return;
              const lbl = opt.optionText.trim();
              if (!lbl) return;
              if (!questions[qIndex].options[lbl]) {
                questions[qIndex].options[lbl] = { optionText: lbl, count: 0 };
              }
              if (opt.selected) questions[qIndex].options[lbl].count++;
            });
          }
        });

        const day = dayjs(row.workshop_response_created).format('YYYY-MM-DD');
        timeSeries[day] = (timeSeries[day] || 0) + 1;
      });

      sampleAnalytics = {
        promptId: samplePromptId,
        templateId: sampleTemplateId,
        totalResponses: sampleRows.length,
        questions,
        timeSeries,
      };
    }

    return res.status(200).json({
      currentWorkshop,
      openModules,
      firstPromptPath,
      recentResponses,
      communityStats,
      sampleAnalytics,
    });
  } catch (error) {
    console.error('Homepage feed error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/homepage/responses
 *
 * Public (no auth, IP rate-limited). Batch-saves anonymous responses.
 * Creates a guest account if the email is new, or appends to an existing
 * guest account. Rejects if the email belongs to a full (non-guest) user.
 *
 * Body: { email, workshopId, responses: [{ promptId, templateId, content }] }
 */
homepageRouter.post('/responses', responseLimiter, async (req, res) => {
  try {
    const { email, workshopId, responses } = req.body;

    if (!email || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'email and responses[] are required.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // 1. Check if user with this email already exists
    const [existingRows] = await connection.query(
      'SELECT user_id, user_type FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    let userId;
    let statusLabel;

    if (existingRows.length) {
      const existing = existingRows[0];

      if (existing.user_type !== 'guest') {
        return res.status(200).json({
          status: 'existing_user',
          message: 'An account with this email already exists. Please log in to save your responses.',
        });
      }

      // Returning guest: reuse their user_id
      userId = existing.user_id;
      statusLabel = 'appended';
    } else {
      // 2. Create a new guest user
      const emailPrefix = email.split('@')[0] || 'Guest';
      const guestUsername = `guest_${randomUUID().slice(0, 8)}`;
      const tempPassword = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

      const [insertResult] = await connection.query(
        `INSERT INTO users (username, email, first_name, last_name, user_password, user_type, user_phone)
         VALUES (?, ?, ?, ?, ?, 'guest', '0000000000')`,
        [guestUsername, email.trim().toLowerCase(), emailPrefix, '', tempPassword]
      );

      userId = insertResult.insertId;
      statusLabel = 'created';
    }

    // 3. Batch-insert responses (with dedup for returning guests)
    let insertedCount = 0;
    for (const r of responses) {
      const { promptId, templateId, content } = r;
      if (!promptId || content == null) continue;

      // Check for existing response from this user for this prompt
      const [dupCheck] = await connection.query(
        'SELECT 1 FROM workshop_responses WHERE user_id = ? AND workshop_prompt_id = ? LIMIT 1',
        [userId, promptId]
      );
      if (dupCheck.length > 0) continue;

      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const autoAccept = [1, 3, 6, 7, 9].includes(Number(templateId)) ? 1 : 0;

      await connection.query(
        `INSERT INTO workshop_responses
          (user_id, workshop_prompt_id, workshop_response_content, workshop_response_acceptance)
         VALUES (?, ?, ?, ?)`,
        [userId, promptId, contentStr, autoAccept]
      );
      insertedCount++;
    }

    // 4. Check if guest has completed all prompts → auto-RSVP
    if (workshopId) {
      try {
        const [rsvpAccomplishmentRows] = await connection.query(
          'SELECT * FROM number_of_prompts_per_workshop_view WHERE workshop_id = ?',
          [workshopId]
        );
        const [userAccomplishmentRows] = await connection.query(
          'SELECT * FROM user_rsvp_ready_view WHERE user_id = ?',
          [userId]
        );

        if (
          rsvpAccomplishmentRows.length > 0 &&
          rsvpAccomplishmentRows.length === userAccomplishmentRows.length
        ) {
          const [existingRsvp] = await connection.query(
            'SELECT 1 FROM workshop_rsvps WHERE user_id = ? AND workshop_id = ? LIMIT 1',
            [userId, workshopId]
          );
          if (existingRsvp.length === 0) {
            await connection.query(
              'INSERT INTO workshop_rsvps (user_id, workshop_id) VALUES (?, ?)',
              [userId, workshopId]
            );
            try {
              await notificationQueue.add('workshopRsvpUnconfirmed', {
                userId,
                workshopId: Number(workshopId),
              });
              console.log(`[queue] enqueued: queue=notification, jobName=workshopRsvpUnconfirmed, userId=${userId}, workshopId=${workshopId}`);
            } catch (notifErr) {
              console.error('Failed to enqueue workshopRsvpUnconfirmed:', notifErr.message);
            }
          }
        }
      } catch (rsvpErr) {
        console.error('RSVP check error (non-fatal):', rsvpErr.message);
      }
    }

    // 5. Enqueue registration invite email
    try {
      await notificationQueue.add('guestRegistrationInvite', {
        userId,
        email: email.trim().toLowerCase(),
      });
      console.log(`[queue] enqueued: queue=notification, jobName=guestRegistrationInvite, userId=${userId}`);
    } catch (notifErr) {
      console.error('Failed to enqueue guestRegistrationInvite:', notifErr.message);
    }

    console.log(`[homepage] guest responses: email=${email}, userId=${userId}, status=${statusLabel}, insertedCount=${insertedCount}`);
    return res.status(201).json({
      status: statusLabel,
      userId,
      insertedCount,
      message: statusLabel === 'created'
        ? 'Responses saved! Check your email to complete your account.'
        : 'Additional responses saved to your guest account.',
    });
  } catch (error) {
    console.error('Homepage responses error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
