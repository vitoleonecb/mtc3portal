import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';

import { notifyUser, notifyUsers, sendEmail } from '../services/notificationService.js';
import notificationQueue from '../queues/notificationQueue.js';

// Email templates
import { moduleOpenEmail } from '../templates/emails/moduleOpen.js';
import { lastDayToSubmitEmail } from '../templates/emails/lastDayToSubmit.js';
import { materialsReadyEmail } from '../templates/emails/materialsReady.js';
import { workshopRsvpUnconfirmedEmail } from '../templates/emails/workshopRsvpUnconfirmed.js';
import { showcaseRsvpUnconfirmedEmail } from '../templates/emails/showcaseRsvpUnconfirmed.js';
import { showcaseTicketEmail } from '../templates/emails/showcaseTicket.js';
import { newShowcaseEmail } from '../templates/emails/newShowcase.js';
import { confirmEmailTemplate } from '../templates/emails/confirmEmail.js';
import { resetPasswordEmail } from '../templates/emails/resetPassword.js';
import { guestRegistrationInviteEmail } from '../templates/emails/guestRegistrationInvite.js';

dotenv.config({ path: '../.env' });

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  multipleStatements: true,
  waitForConnections: true,
});

const redisConn = new IORedis({ maxRetriesPerRequest: null });

// ── Helpers ────────────────────────────────────────────────────

/**
 * Query users whose notification settings allow a specific sub-option.
 * Returns rows with user_id, email, user_phone, first_name, notification_settings.
 */
async function getEligibleUsers(subOption) {
  const [rows] = await db.query(
    `SELECT user_id, email, user_phone, first_name, notification_settings
     FROM users
     WHERE JSON_EXTRACT(notification_settings, '$.channel') != 'none'
       AND JSON_EXTRACT(notification_settings, '$.${subOption}') = true`
  );
  return rows;
}

/** Look up a single user by ID (for targeted notifications). */
async function getUserById(userId) {
  const [[user]] = await db.query(
    'SELECT user_id, email, user_phone, first_name, notification_settings FROM users WHERE user_id = ?',
    [userId]
  );
  return user;
}

// ── Register repeatable monthly showcase check on startup ──────
(async () => {
  try {
    await notificationQueue.add('monthlyShowcaseCheck', {}, {
      repeat: { pattern: '0 14 1 * *' }, // 9 AM ET ≈ 14:00 UTC on the 1st
      jobId: 'monthly-showcase-check',
    });
    console.log('[notificationWorker] Registered monthlyShowcaseCheck repeatable job');
  } catch (err) {
    console.warn('[notificationWorker] Could not register repeatable job:', err.message);
  }
})();

// ── Batch-ticket + notification helper (shared by monthlyShowcaseCheck
//    and the showcase-create fallback) ──────────────────────────
async function processShowcaseBatchTickets(showcaseId) {
  // 1. Get showcase details
  const [[showcase]] = await db.query(
    'SELECT * FROM showcases WHERE showcase_id = ?',
    [showcaseId]
  );
  if (!showcase) return;

  // 2. Find active subscribers without a ticket
  const [eligible] = await db.query(
    `SELECT us.user_id
     FROM user_subscriptions us
     WHERE us.status = 'active'
       AND us.user_id NOT IN (
         SELECT st.user_id FROM showcase_tickets st
         WHERE st.showcase_id = ? AND st.ticket_status != 'cancelled'
       )`,
    [showcaseId]
  );

  if (eligible.length === 0) return;

  // 3. Batch-create membership tickets
  const values = eligible.map(u => [showcaseId, u.user_id, 'membership', 'unconfirmed', 0.00]);
  await db.query(
    `INSERT INTO showcase_tickets (showcase_id, user_id, ticket_type, ticket_status, price_paid) VALUES ?`,
    [values]
  );

  // 4. Enqueue individual notification
  const userIds = eligible.map(u => u.user_id);
  await notificationQueue.add('showcaseRsvpUnconfirmed', { showcaseId, userIds });
}

// ── Worker ─────────────────────────────────────────────────────

const notificationWorker = new Worker(
  'notificationQueue',
  async (job) => {
    console.log(`[notificationWorker] job: ${job.name}`, job.data);

    switch (job.name) {

      // ═══════════════════════════════════════════════════════
      // 1. Module Open
      // ═══════════════════════════════════════════════════════
      case 'moduleOpen': {
        const { moduleId, workshopId } = job.data;
        const [[mod]] = await db.query(
          'SELECT workshop_module_name FROM workshop_modules WHERE workshop_module_id = ?', [moduleId]
        );
        const [[ws]] = await db.query(
          'SELECT workshop_name FROM workshops WHERE workshop_id = ?', [workshopId]
        );
        if (!mod || !ws) break;

        const users = await getEligibleUsers('module_open');
        const appUrl = `${APP_BASE_URL}/workshops/${workshopId}/modules`;

        await notifyUsers(
          users,
          `New Module Open — ${ws.workshop_name}`,
          (u) => moduleOpenEmail({
            userName: u.first_name, workshopName: ws.workshop_name,
            moduleName: mod.workshop_module_name, appUrl, userId: u.user_id,
          }).html,
          (u) => `MTC3 — New module '${mod.workshop_module_name}' is open for '${ws.workshop_name}'! Respond now: ${appUrl}`,
        );
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 2. Last Day Reminder
      // ═══════════════════════════════════════════════════════
      case 'lastDayReminder': {
        const { moduleId, workshopId } = job.data;
        const [[mod]] = await db.query(
          'SELECT workshop_module_name FROM workshop_modules WHERE workshop_module_id = ?', [moduleId]
        );
        const [[ws]] = await db.query(
          'SELECT workshop_name FROM workshops WHERE workshop_id = ?', [workshopId]
        );
        if (!mod || !ws) break;

        // Get the processing timestamp from cycle_jobs for deadline display
        const [[cycleJob]] = await db.query(
          `SELECT scheduled_for FROM cycle_jobs
           WHERE module_id = ? AND job_name = 'processModule' AND status = 'pending'
           ORDER BY scheduled_for ASC LIMIT 1`,
          [moduleId]
        );
        const deadlineDate = cycleJob
          ? dayjs(cycleJob.scheduled_for).format('MMMM D, YYYY [at] h:mm A')
          : 'soon';

        // Get total prompt count for this module
        const [[{ promptCount }]] = await db.query(
          'SELECT COUNT(*) AS promptCount FROM workshop_prompts WHERE workshop_module_id = ?',
          [moduleId]
        );

        // Get all eligible users, then filter out those who have already
        // responded to every prompt in this module
        const allUsers = await getEligibleUsers('last_day_reminder');
        const eligibleUsers = [];
        for (const u of allUsers) {
          const [[{ responseCount }]] = await db.query(
            `SELECT COUNT(*) AS responseCount FROM workshop_responses wr
             JOIN workshop_prompts wp ON wr.workshop_prompt_id = wp.workshop_prompt_id
             WHERE wp.workshop_module_id = ? AND wr.user_id = ?`,
            [moduleId, u.user_id]
          );
          if (responseCount < promptCount) {
            eligibleUsers.push(u);
          }
        }

        const appUrl = `${APP_BASE_URL}/workshops/${workshopId}/modules`;

        await notifyUsers(
          eligibleUsers,
          `Last Day to Submit — ${ws.workshop_name}`,
          (u) => lastDayToSubmitEmail({
            userName: u.first_name, workshopName: ws.workshop_name,
            moduleName: mod.workshop_module_name, deadlineDate, appUrl, userId: u.user_id,
          }).html,
          (u) => `MTC3 — Last day to submit responses for '${mod.workshop_module_name}' in '${ws.workshop_name}'! Deadline: ${deadlineDate}. Go: ${appUrl}`,
        );
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 3. Materials Ready
      // ═══════════════════════════════════════════════════════
      case 'materialsReady': {
        const { workshopId, eligibleUserIds } = job.data;
        const [[ws]] = await db.query(
          'SELECT workshop_name FROM workshops WHERE workshop_id = ?', [workshopId]
        );
        if (!ws) break;

        const materialsUrl = `${APP_BASE_URL}/workshops/${workshopId}/materials`;

        // Fetch user details for each eligible user, filtering by sub-option
        for (const uid of eligibleUserIds) {
          const user = await getUserById(uid);
          if (!user) continue;
          const settings = typeof user.notification_settings === 'string'
            ? JSON.parse(user.notification_settings) : (user.notification_settings || {});
          if (settings.channel === 'none' || !settings.materials_ready) continue;

          const { subject, html } = materialsReadyEmail({
            userName: user.first_name, workshopName: ws.workshop_name,
            materialsUrl, userId: user.user_id,
          });
          const sms = `MTC3 — Materials are ready for '${ws.workshop_name}'! View them here: ${materialsUrl}`;
          await notifyUser(user, subject, html, sms);
        }
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 4. Workshop RSVP Unconfirmed
      // ═══════════════════════════════════════════════════════
      case 'workshopRsvpUnconfirmed': {
        const { userId, workshopId } = job.data;
        const user = await getUserById(userId);
        if (!user) break;
        const settings = typeof user.notification_settings === 'string'
          ? JSON.parse(user.notification_settings) : (user.notification_settings || {});
        if (settings.channel === 'none' || !settings.workshop_rsvp) break;

        const [[ws]] = await db.query(
          'SELECT workshop_name FROM workshops WHERE workshop_id = ?', [workshopId]
        );
        if (!ws) break;

        const rsvpUrl = `${APP_BASE_URL}/workshops/${workshopId}/rsvp/${userId}`;
        const { subject, html } = workshopRsvpUnconfirmedEmail({
          userName: user.first_name, workshopName: ws.workshop_name,
          rsvpUrl, userId: user.user_id,
        });
        const sms = `MTC3 — You've unlocked your RSVP for '${ws.workshop_name}'! Confirm here: ${rsvpUrl}`;
        await notifyUser(user, subject, html, sms);
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 5. Monthly Showcase Check (cron)
      // ═══════════════════════════════════════════════════════
      case 'monthlyShowcaseCheck': {
        const yearMonth = dayjs().format('YYYY-MM');

        // Check tracking table
        const [[existing]] = await db.query(
          'SELECT * FROM monthly_showcase_notifications WHERE year_month = ?',
          [yearMonth]
        );
        if (existing && existing.status === 'sent') {
          console.log(`[notificationWorker] Monthly showcase already sent for ${yearMonth}`);
          break;
        }

        // Look for an upcoming showcase
        const [[showcase]] = await db.query(
          `SELECT showcase_id FROM showcases
           WHERE showcase_status = 'upcoming' AND showcase_date >= NOW()
           ORDER BY showcase_date ASC LIMIT 1`
        );

        if (showcase) {
          await processShowcaseBatchTickets(showcase.showcase_id);

          // Mark as sent
          await db.query(
            `INSERT INTO monthly_showcase_notifications (year_month, status, showcase_id, sent_at)
             VALUES (?, 'sent', ?, NOW())
             ON DUPLICATE KEY UPDATE status = 'sent', showcase_id = VALUES(showcase_id), sent_at = NOW()`,
            [yearMonth, showcase.showcase_id]
          );
        } else {
          // No showcase yet — mark pending so showcase creation can pick it up
          await db.query(
            `INSERT IGNORE INTO monthly_showcase_notifications (year_month, status)
             VALUES (?, 'pending')`,
            [yearMonth]
          );
          console.log(`[notificationWorker] No upcoming showcase for ${yearMonth}, marked pending`);
        }
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 5b. Showcase RSVP Unconfirmed (dispatched by monthly check or batch-tickets)
      // ═══════════════════════════════════════════════════════
      case 'showcaseRsvpUnconfirmed': {
        const { showcaseId, userIds } = job.data;
        const [[showcase]] = await db.query(
          'SELECT * FROM showcases WHERE showcase_id = ?', [showcaseId]
        );
        if (!showcase) break;

        const showcaseDate = dayjs(showcase.showcase_date).format('MMMM D, YYYY');

        for (const uid of userIds) {
          const user = await getUserById(uid);
          if (!user) continue;
          const settings = typeof user.notification_settings === 'string'
            ? JSON.parse(user.notification_settings) : (user.notification_settings || {});
          if (settings.channel === 'none' || !settings.showcase_announcements) continue;

          const confirmUrl = `${APP_BASE_URL}/showcases`;
          const { subject, html } = showcaseRsvpUnconfirmedEmail({
            userName: user.first_name, showcaseName: showcase.showcase_name,
            showcaseDate, showcaseLocation: showcase.showcase_location || '',
            confirmUrl, userId: user.user_id,
          });
          const sms = `MTC3 — You have an unconfirmed RSVP for '${showcase.showcase_name}' on ${showcaseDate}! Confirm: ${confirmUrl}`;
          await notifyUser(user, subject, html, sms);
        }
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 6. Showcase Ticket Purchased
      // ═══════════════════════════════════════════════════════
      case 'showcaseTicket': {
        const { showcaseId, userId } = job.data;
        const user = await getUserById(userId);
        if (!user) break;
        const settings = typeof user.notification_settings === 'string'
          ? JSON.parse(user.notification_settings) : (user.notification_settings || {});
        if (settings.channel === 'none' || !settings.showcase_ticket) break;

        const [[showcase]] = await db.query(
          'SELECT * FROM showcases WHERE showcase_id = ?', [showcaseId]
        );
        if (!showcase) break;

        const showcaseDate = dayjs(showcase.showcase_date).format('MMMM D, YYYY');
        const ticketUrl = `${APP_BASE_URL}/showcases`;

        const { subject, html } = showcaseTicketEmail({
          userName: user.first_name, showcaseName: showcase.showcase_name,
          showcaseDate, showcaseLocation: showcase.showcase_location || '',
          ticketUrl, userId: user.user_id,
        });
        const sms = `MTC3 — Your ticket for '${showcase.showcase_name}' on ${showcaseDate} is confirmed! Details: ${ticketUrl}`;
        await notifyUser(user, subject, html, sms);
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 7. New Showcase Announcement (non-subscribers)
      // ═══════════════════════════════════════════════════════
      case 'newShowcase': {
        const { showcaseId } = job.data;
        const [[showcase]] = await db.query(
          'SELECT * FROM showcases WHERE showcase_id = ?', [showcaseId]
        );
        if (!showcase) break;

        // Non-subscriber users with showcase_announcements enabled
        const [users] = await db.query(
          `SELECT u.user_id, u.email, u.user_phone, u.first_name, u.notification_settings
           FROM users u
           WHERE JSON_EXTRACT(u.notification_settings, '$.channel') != 'none'
             AND JSON_EXTRACT(u.notification_settings, '$.showcase_announcements') = true
             AND u.user_id NOT IN (
               SELECT us.user_id FROM user_subscriptions us WHERE us.status = 'active'
             )`
        );

        const showcaseDate = dayjs(showcase.showcase_date).format('MMMM D, YYYY');
        const purchaseUrl = `${APP_BASE_URL}/showcases/${showcaseId}/tickets`;

        await notifyUsers(
          users,
          `New Showcase — ${showcase.showcase_name}`,
          (u) => newShowcaseEmail({
            userName: u.first_name, showcaseName: showcase.showcase_name,
            showcaseDate, showcaseLocation: showcase.showcase_location || '',
            purchaseUrl, userId: u.user_id,
          }).html,
          (u) => `MTC3 — New showcase '${showcase.showcase_name}' on ${showcaseDate} at ${showcase.showcase_location || 'TBD'}! Get your ticket: ${purchaseUrl}`,
        );
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 8. Confirm Email Registration
      // ═══════════════════════════════════════════════════════
      case 'confirmEmail': {
        const { userId, email, confirmToken } = job.data;
        const user = await getUserById(userId);
        const userName = user?.first_name || 'there';

        const confirmUrl = `${APP_BASE_URL}/confirm-email?token=${confirmToken}`;
        const { subject, html } = confirmEmailTemplate({
          userName, email, confirmUrl, userId,
        });
        // Always send, no preference check
        await sendEmail(email, subject, html);
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 9. Reset Password
      // ═══════════════════════════════════════════════════════
      case 'resetPassword': {
        const { userId, email, resetToken } = job.data;
        const user = await getUserById(userId);
        const userName = user?.first_name || 'there';

        const resetUrl = `${APP_BASE_URL}/reset-password?token=${resetToken}`;
        const { subject, html } = resetPasswordEmail({
          userName, resetUrl, userId,
        });
        // Always send, no preference check
        await sendEmail(email, subject, html);
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 10. Guest Registration Invite
      // ═══════════════════════════════════════════════════════
      case 'guestRegistrationInvite': {
        const { userId, email } = job.data;
        const user = await getUserById(userId);
        const userName = user?.first_name || 'there';

        const registerUrl = `${APP_BASE_URL}/register?guest=${userId}&email=${encodeURIComponent(email)}`;
        const { subject, html } = guestRegistrationInviteEmail({
          userName, email, registerUrl, userId,
        });
        // Transactional email — send directly, no preference check
        await sendEmail(email, subject, html);
        break;
      }

      // ═══════════════════════════════════════════════════════
      // 5c. Showcase create fallback (check pending monthly row)
      // ═══════════════════════════════════════════════════════
      case 'showcaseCreatedFallback': {
        const { showcaseId } = job.data;
        const yearMonth = dayjs().format('YYYY-MM');

        const [[pending]] = await db.query(
          `SELECT * FROM monthly_showcase_notifications
           WHERE year_month = ? AND status = 'pending'`,
          [yearMonth]
        );

        if (pending) {
          await processShowcaseBatchTickets(showcaseId);
          await db.query(
            `UPDATE monthly_showcase_notifications
             SET status = 'sent', showcase_id = ?, sent_at = NOW()
             WHERE year_month = ?`,
            [showcaseId, yearMonth]
          );
          console.log(`[notificationWorker] Processed pending monthly showcase for ${yearMonth}`);
        }
        break;
      }

      default:
        console.log(`[notificationWorker] Unknown job: ${job.name}`);
    }
  },
  { connection: redisConn }
);

export default notificationWorker;
