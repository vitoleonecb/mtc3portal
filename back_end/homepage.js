import express from 'express';
import { connection } from './app.js';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import notificationQueue from './queues/notificationQueue.js';
import { ensureWorkshopRsvpForCompletedPrompts } from './services/rsvpService.js';
import { getPromptContext } from './services/workshopAccessPolicy.js';
import { verifyGuestWorkshopToken } from './services/guestWorkshopLinks.js';
import {
  getMCAnalytics,
  getCLAnalytics,
  getDragAndDropAnalytics,
  getShortResponseAnalytics,
  getDropDownAnalytics,
  getSampleRaterAnalytics,
  getNotationAnalytics,
} from './services/analyticsService.js';

export const homepageRouter = express.Router();

const SALT_ROUNDS = 10;

const moduleOpenEmailSettings = {
  channel: 'email',
  module_open: true,
  last_day_reminder: false,
  materials_ready: false,
  workshop_rsvp: false,
  showcase_announcements: false,
  showcase_ticket: false,
};

function extractPublicResponseText(rawContent) {
  let parsed = rawContent;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return parsed.trim(); }
  }

  const parts = [];
  const collect = (value) => {
    if (value == null) return;
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim();
      if (text) parts.push(text);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === 'object') {
      if (value.answer) collect(value.answer);
      if (value.notationResponse) collect(value.notationResponse);
      if (value.optionLabel) collect(value.optionLabel);
      if (value.keyName) collect(value.keyName);
      if (value.rating != null) {
        const rating = Number(value.rating);
        if (Number.isFinite(rating) && rating >= 1 && rating <= 5) collect(rating);
      }
      if (Array.isArray(value.options)) {
        value.options
          .filter((option) => option?.selected)
          .forEach((option) => collect(option.optionText));
      }
    }
  };

  collect(parsed);
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

async function getPublicAnalyticsForPrompt(promptId, templateId) {
  switch (Number(templateId)) {
    case 1: return getMCAnalytics(promptId);
    case 3: return getCLAnalytics(promptId);
    case 4: return getShortResponseAnalytics(promptId);
    case 6: return getDragAndDropAnalytics(promptId);
    case 7: return getSampleRaterAnalytics(promptId);
    case 8: return getNotationAnalytics(promptId);
    case 9: return getDropDownAnalytics(promptId);
    default: return null;
  }
}

// Rate limiter for the public batch response endpoint
const responseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP. Please try again later.' },
});

const guestProgressLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const guestLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

homepageRouter.post('/guest-progress', guestProgressLimiter, async (req, res) => {
  const guest = verifyGuestWorkshopToken(req.body?.guestToken, process.env.ACCESS_TOKEN_SECRET);
  if (!guest) return res.status(403).json({ error: 'This continuation link has expired or is invalid.' });

  try {
    const [[user]] = await connection.query(
      'SELECT user_id, email, user_type FROM users WHERE user_id = ? AND email = ? LIMIT 1',
      [guest.userId, guest.email]
    );
    if (!user || user.user_type !== 'guest') {
      return res.status(403).json({ error: 'This guest link is no longer available.' });
    }
    const [rows] = await connection.query(
      `SELECT wp.workshop_prompt_id AS promptId, wp.prompt_template_id AS templateId,
              wm.workshop_module_id AS moduleId, wr.workshop_response_content AS content
       FROM workshop_responses wr
       JOIN workshop_prompts wp ON wp.workshop_prompt_id = wr.workshop_prompt_id
       JOIN workshop_modules wm ON wm.workshop_module_id = wp.workshop_module_id
       WHERE wr.user_id = ? AND wm.workshop_id = ?`,
      [guest.userId, guest.workshopId]
    );
    const [[rsvp]] = await connection.query(
      'SELECT 1 FROM workshop_rsvps WHERE user_id = ? AND workshop_id = ? LIMIT 1',
      [guest.userId, guest.workshopId]
    );
    return res.json({ workshopId: guest.workshopId, email: user.email, rsvpEarned: Boolean(rsvp), responses: rows.map((row) => {
      let content = row.content;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch { /* Plain text response. */ }
      }
      return { ...row, content };
    }) });
  } catch (error) {
    console.error('Guest progress error:', error.message);
    return res.status(500).json({ error: 'Could not load workshop progress.' });
  }
});

homepageRouter.post('/guest-link', guestLinkLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const workshopId = Number(req.body?.workshopId);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isInteger(workshopId) || workshopId <= 0) {
    return res.status(400).json({ error: 'Valid email and workshopId are required.' });
  }

  try {
    const [[guest]] = await connection.query(
      `SELECT u.user_id
       FROM users u
       JOIN workshop_responses wr ON wr.user_id = u.user_id
       JOIN workshop_prompts wp ON wp.workshop_prompt_id = wr.workshop_prompt_id
       JOIN workshop_modules wm ON wm.workshop_module_id = wp.workshop_module_id
       WHERE u.email = ? AND u.user_type = 'guest' AND wm.workshop_id = ?
       LIMIT 1`,
      [email, workshopId]
    );
    if (guest) {
      const [[rsvp]] = await connection.query(
        'SELECT 1 FROM workshop_rsvps WHERE user_id = ? AND workshop_id = ? LIMIT 1',
        [guest.user_id, workshopId]
      );
      await notificationQueue.add('guestRegistrationInvite', {
        userId: guest.user_id, email, workshopId, rsvpEarned: Boolean(rsvp),
      });
    }
    return res.json({ message: 'If this email has saved workshop work, a fresh link is on its way.' });
  } catch (error) {
    console.error('Guest link request error:', error.message);
    return res.status(500).json({ error: 'Could not request a new link.' });
  }
});

/**
 * GET /api/homepage/feed
 *
 * Public (no auth). Returns everything the dynamic homepage needs:
 *   - currentWorkshop  – the nearest upcoming workshop with public-visible modules
 *   - openModules      – all open modules with their full prompt lists
 *   - publicPreviewModules – processing/completed modules with anonymized approved response previews
 *   - firstPromptPath  – convenience path for logged-in CTA
 *   - recentResponses  – privacy-safe snippets for the typewriter ticker
 *   - communityStats   – aggregate counts for social proof
 *   - sampleAnalytics  – chart-ready data for the analytics showcase
 */
homepageRouter.get('/feed', async (req, res) => {
  try {
    // ---------- Current Workshop + Public-Visible Modules + Prompts ----------
    const requestedWorkshopId = Number(req.query.workshopId);
    const hasRequestedWorkshop = Number.isInteger(requestedWorkshopId) && requestedWorkshopId > 0;
    if (req.query.workshopId != null && !hasRequestedWorkshop) {
      return res.status(400).json({ error: 'Valid workshopId is required.' });
    }
    const defaultWorkshopSelectionSql = `
      SELECT DISTINCT w.workshop_id, w.workshop_name, w.workshop_description,
             w.workshop_date,
             (w.workshop_date > NOW()) AS is_upcoming,
             (w.workshop_location IS NOT NULL AND TRIM(w.workshop_location) != '') AS has_workshop_location
      FROM workshops w
      JOIN workshop_modules wm ON w.workshop_id = wm.workshop_id
      WHERE wm.workshop_module_status != 'pending'
        AND w.workshop_date > NOW()
      ORDER BY w.workshop_date ASC, w.workshop_id DESC
      LIMIT 1
    `;
    const workshopSelectionSql = hasRequestedWorkshop
      ? `
          SELECT DISTINCT w.workshop_id, w.workshop_name, w.workshop_description,
                 w.workshop_date,
                 (w.workshop_date > NOW()) AS is_upcoming,
                 (w.workshop_location IS NOT NULL AND TRIM(w.workshop_location) != '') AS has_workshop_location
          FROM workshops w
          LEFT JOIN showcases s ON w.showcase_id = s.showcase_id
          JOIN workshop_modules wm ON wm.workshop_id = w.workshop_id
          WHERE w.workshop_id = ?
            AND wm.workshop_module_status != 'pending'
            AND (w.workshop_date > NOW() OR s.showcase_id IS NOT NULL)
          LIMIT 1
        `
      : defaultWorkshopSelectionSql;
    let [workshopRows] = await connection.query(
      workshopSelectionSql,
      hasRequestedWorkshop ? [requestedWorkshopId] : []
    );
    if (hasRequestedWorkshop && workshopRows.length === 0) {
      return res.status(404).json({ error: 'Public workshop preview not found.' });
    }

    let currentWorkshop = null;
    let openModules = [];
    let publicPreviewModules = [];
    let firstPromptPath = null;

    if (workshopRows.length) {
      const ws = workshopRows[0];
      currentWorkshop = {
        workshopId: ws.workshop_id,
        workshopName: ws.workshop_name,
        workshopDescription: ws.workshop_description,
        workshopDate: ws.workshop_date,
        hasWorkshopLocation: Boolean(ws.has_workshop_location),
      };

      // Fetch all non-pending modules for this workshop
      const [moduleRows] = await connection.query(`
        SELECT wm.workshop_module_id, wm.workshop_module_name, wm.workshop_module_status
        FROM workshop_modules wm
        WHERE wm.workshop_id = ? AND wm.workshop_module_status != 'pending'
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

      const publicModules = moduleRows.map(m => ({
        moduleId: m.workshop_module_id,
        moduleName: m.workshop_module_name,
        moduleStatus: m.workshop_module_status,
        prompts: promptsByModule[m.workshop_module_id] || [],
      }));

      openModules = publicModules
        .filter((module) => module.moduleStatus === 'open')
        .map((module) => ({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          moduleStatus: 'open',
          prompts: module.prompts.map((prompt) => ({
            promptId: prompt.promptId,
            templateId: prompt.templateId,
            options: prompt.options,
            reference: prompt.reference,
          })),
        }));

      const previewModules = publicModules.filter((module) =>
        ['processing', 'completed'].includes(module.moduleStatus)
      );

      if (previewModules.length) {
        const previewModuleIds = previewModules.map((module) => module.moduleId);
        const [previewRows] = await connection.query(`
          SELECT
            wm.workshop_module_id,
            wp.workshop_prompt_id,
            wp.prompt_template_id,
            wr.workshop_response_content,
            wr.workshop_response_created
          FROM workshop_responses wr
          JOIN workshop_prompts wp ON wr.workshop_prompt_id = wp.workshop_prompt_id
          JOIN workshop_modules wm ON wp.workshop_module_id = wm.workshop_module_id
          WHERE wm.workshop_module_id IN (?)
            AND wr.workshop_response_acceptance = 1
          ORDER BY wr.workshop_response_created DESC
          LIMIT 30
        `, [previewModuleIds]);

        const responsesByModule = {};
        const responsesByPrompt = {};
        for (const row of previewRows) {
          const text = extractPublicResponseText(row.workshop_response_content);
          if (!text) continue;
          if (!responsesByModule[row.workshop_module_id]) {
            responsesByModule[row.workshop_module_id] = [];
          }
          if (!responsesByPrompt[row.workshop_prompt_id]) responsesByPrompt[row.workshop_prompt_id] = [];
          if (responsesByModule[row.workshop_module_id].length < 6) {
            responsesByModule[row.workshop_module_id].push({
              promptId: row.workshop_prompt_id,
              templateId: row.prompt_template_id,
              text,
            });
          }
          if (responsesByPrompt[row.workshop_prompt_id].length < 6) {
            responsesByPrompt[row.workshop_prompt_id].push({ text });
          }
        }

        publicPreviewModules = await Promise.all(previewModules.map(async (module) => {
          const prompts = await Promise.all(module.prompts.map(async (prompt) => {
            const analytics = await getPublicAnalyticsForPrompt(prompt.promptId, prompt.templateId).catch((error) => {
              console.error('Public analytics preview error:', error.message);
              return null;
            });

            return {
              promptId: prompt.promptId,
              templateId: prompt.templateId,
              options: prompt.options,
              reference: prompt.reference,
              analytics,
              responses: responsesByPrompt[prompt.promptId] || [],
            };
          }));

          return {
            moduleId: module.moduleId,
            moduleName: module.moduleName,
            moduleStatus: module.moduleStatus,
            promptCount: module.prompts.length,
            prompts,
            responsePreviews: responsesByModule[module.moduleId] || [],
          };
        }));
      }

      // Build convenience path for logged-in CTA
      if (openModules.length && openModules[0].prompts.length) {
        const firstMod = openModules[0];
        const firstPrompt = firstMod.prompts[0];
        firstPromptPath = `/workshops/${ws.workshop_id}/modules/${firstMod.moduleId}/prompts/${firstPrompt.promptId}`;
      }

      if (hasRequestedWorkshop) {
        if (!ws.is_upcoming) {
          const openReadOnlyModules = openModules.map((module) => ({
            ...module,
            prompts: module.prompts.map((prompt) => ({
              ...prompt,
              analytics: null,
              responses: [],
            })),
          }));
          publicPreviewModules = [...openReadOnlyModules, ...publicPreviewModules]
            .sort((a, b) => a.moduleId - b.moduleId);
          openModules = [];
          firstPromptPath = null;
        }
      }
    }

    // ---------- Recent Responses (typewriter ticker) ----------
    const [recentRows] = await connection.query(`
      SELECT
        wr.workshop_response_content,
        wr.workshop_response_created
      FROM workshop_responses wr
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
        text,
      };
    }).filter((r) => r.text.length > 0);

    // ---------- Community Stats ----------
    const [[{ totalResponses }]] = await connection.query(
      'SELECT COUNT(*) AS totalResponses FROM workshop_responses'
    );
    const [[{ totalUsers }]] = await connection.query(
      'SELECT COUNT(*) AS totalUsers FROM users WHERE user_type IS NULL OR user_type != "guest"'
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
      publicPreviewModules,
      firstPromptPath,
      recentResponses: hasRequestedWorkshop ? [] : recentResponses,
      communityStats,
      sampleAnalytics: hasRequestedWorkshop ? null : sampleAnalytics,
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
    const { email, workshopId, responses, guestToken } = req.body;
    const guest = guestToken
      ? verifyGuestWorkshopToken(guestToken, process.env.ACCESS_TOKEN_SECRET)
      : null;
    if (guestToken && (!guest || Number(workshopId) !== guest.workshopId)) {
      return res.status(403).json({ error: 'This continuation link has expired or is invalid.' });
    }

    if ((!email && !guest) || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'Email or guest link and responses[] are required.' });
    }

    const recipientEmail = guest?.email || email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalizedWorkshopId = Number(workshopId);
    if (!Number.isInteger(normalizedWorkshopId) || normalizedWorkshopId <= 0) {
      return res.status(400).json({ error: 'Valid workshopId is required.' });
    }
    const [currentRows] = await connection.query(
      `SELECT DISTINCT w.workshop_id, w.workshop_date
       FROM workshops w
       JOIN workshop_modules wm ON wm.workshop_id = w.workshop_id
       WHERE wm.workshop_module_status != 'pending' AND w.workshop_date > NOW()
       ORDER BY w.workshop_date ASC, w.workshop_id DESC LIMIT 1`
    );
    if (Number(currentRows[0]?.workshop_id) !== normalizedWorkshopId) {
      const [[selectedWorkshop]] = await connection.query(
        `SELECT w.workshop_id
         FROM workshops w
         JOIN workshop_modules wm ON wm.workshop_id = w.workshop_id
         WHERE w.workshop_id = ? AND w.workshop_date > NOW()
           AND wm.workshop_module_status = 'open'
         LIMIT 1`,
        [normalizedWorkshopId]
      );
      if (!selectedWorkshop) {
        return res.status(409).json({ error: 'Only upcoming public workshops accept preview responses.' });
      }
    }

    const seenPromptIds = new Set();
    const validatedResponses = [];
    for (const response of responses) {
      const promptId = Number(response?.promptId);
      if (!Number.isInteger(promptId) || promptId <= 0 || response.content == null || seenPromptIds.has(promptId)) {
        return res.status(400).json({ error: 'Each response must identify a distinct prompt and include content.' });
      }
      const prompt = await getPromptContext(connection, promptId);
      if (!prompt || Number(prompt.workshopId) !== normalizedWorkshopId
          || (response.moduleId != null && Number(response.moduleId) !== Number(prompt.moduleId))) {
        return res.status(400).json({ error: 'A response does not belong to this workshop.' });
      }
      if (prompt.moduleStatus !== 'open') {
        return res.status(409).json({ error: 'A preview module is no longer open for responses.' });
      }
      seenPromptIds.add(promptId);
      validatedResponses.push({ promptId, templateId: Number(prompt.templateId), content: response.content });
    }

    // 1. Check if user with this email already exists
    const [existingRows] = await connection.query(
      'SELECT user_id, user_type FROM users WHERE email = ? LIMIT 1',
      [recipientEmail]
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
      if (guest && Number(existing.user_id) !== guest.userId) {
        return res.status(403).json({ error: 'This continuation link does not match the guest.' });
      }

      // Returning guest: reuse their user_id
      userId = existing.user_id;
      statusLabel = 'appended';
    } else {
      // 2. Create a new guest user
      if (guest) return res.status(403).json({ error: 'This guest link is no longer available.' });
      const emailPrefix = recipientEmail.split('@')[0] || 'Guest';
      const guestUsername = `guest_${randomUUID().slice(0, 8)}`;
      const tempPassword = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

      const [insertResult] = await connection.query(
        `INSERT INTO users (username, email, first_name, last_name, user_password, user_type, user_phone)
         VALUES (?, ?, ?, ?, ?, 'guest', '0000000000')`,
        [guestUsername, recipientEmail, emailPrefix, '', tempPassword]
      );

      userId = insertResult.insertId;
      statusLabel = 'created';
    }

    // 3. Batch-insert responses (with dedup for returning guests)
    let insertedCount = 0;
    const savedPromptIds = [];
    const skippedPromptIds = [];
    for (const r of validatedResponses) {
      const { promptId, templateId, content } = r;

      // Check for existing response from this user for this prompt
      const [dupCheck] = await connection.query(
        'SELECT 1 FROM workshop_responses WHERE user_id = ? AND workshop_prompt_id = ? LIMIT 1',
        [userId, promptId]
      );
      if (dupCheck.length > 0) {
        skippedPromptIds.push(promptId);
        continue;
      }

      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const autoAccept = [1, 3, 6, 7, 9].includes(Number(templateId)) ? 1 : 0;

      await connection.query(
        `INSERT INTO workshop_responses
          (user_id, workshop_prompt_id, workshop_response_content, workshop_response_acceptance)
         VALUES (?, ?, ?, ?)`,
        [userId, promptId, contentStr, autoAccept]
      );
      insertedCount++;
      savedPromptIds.push(promptId);
    }

    // 4. Check if guest has completed all prompts → auto-RSVP
    let rsvpResult = null;
    if (validatedResponses.length > 0) {
      try {
        rsvpResult = await ensureWorkshopRsvpForCompletedPrompts({
          connection,
          notificationQueue,
          userId,
          workshopId: normalizedWorkshopId,
          notifyOnCreate: false,
        });
        if (rsvpResult.created) {
          console.log(`[homepage] auto-rsvp created: userId=${userId}, workshopId=${workshopId}`);
        }
      } catch (rsvpErr) {
        console.error('RSVP check error:', rsvpErr.message);
        throw rsvpErr;
      }
    }

    // 5. Enqueue registration invite email
    if (insertedCount > 0 || rsvpResult?.created) {
      try {
        await notificationQueue.add('guestRegistrationInvite', {
          userId,
          email: recipientEmail,
          workshopId: normalizedWorkshopId,
          rsvpEarned: Boolean(rsvpResult?.eligible),
        });
        console.log(`[queue] enqueued: queue=notification, jobName=guestRegistrationInvite, userId=${userId}`);
      } catch (notifErr) {
        console.error('Failed to enqueue guestRegistrationInvite:', notifErr.message);
      }
    }

    console.log(`[homepage] guest responses: email=${recipientEmail}, userId=${userId}, status=${statusLabel}, insertedCount=${insertedCount}`);
    return res.status(201).json({
      status: statusLabel,
      userId,
      insertedCount,
      savedPromptIds,
      skippedPromptIds,
      rsvpEarned: Boolean(rsvpResult?.eligible),
      message: insertedCount === 0
        ? 'These responses were already saved.'
        : statusLabel === 'created'
        ? 'Responses saved! Check your email to complete your account.'
        : 'Additional responses saved to your guest account.',
    });
  } catch (error) {
    console.error('Homepage responses error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/homepage/module-open-notify
 *
 * Public email opt-in for visitors who want to know when a new module opens.
 * Creates or reuses a guest account and enables email-only module_open
 * notifications. Registered accounts must log in to edit notification settings.
 */
homepageRouter.post('/module-open-notify', responseLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const [existingRows] = await connection.query(
      'SELECT user_id, user_type FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existingRows.length) {
      const existing = existingRows[0];
      if (existing.user_type !== 'guest') {
        return res.status(200).json({
          status: 'existing_user',
          message: 'That email already has an account. Log in to manage workshop notifications.',
        });
      }

      await connection.query(
        'UPDATE users SET notification_settings = ? WHERE user_id = ?',
        [JSON.stringify(moduleOpenEmailSettings), existing.user_id]
      );

      return res.status(200).json({
        status: 'updated',
        userId: existing.user_id,
        message: "You're on the list. We'll email you when a new module opens.",
      });
    }

    const emailPrefix = normalizedEmail.split('@')[0] || 'Guest';
    const guestUsername = `guest_${randomUUID().slice(0, 8)}`;
    const tempPassword = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

    const [insertResult] = await connection.query(
      `INSERT INTO users
        (username, email, first_name, last_name, user_password, user_type, user_phone, notification_settings)
       VALUES (?, ?, ?, ?, ?, 'guest', '0000000000', ?)`,
      [guestUsername, normalizedEmail, emailPrefix, '', tempPassword, JSON.stringify(moduleOpenEmailSettings)]
    );

    return res.status(201).json({
      status: 'created',
      userId: insertResult.insertId,
      message: "You're on the list. We'll email you when a new module opens.",
    });
  } catch (error) {
    console.error('Homepage module-open notify error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
