/**
 * Notification dispatch service.
 *
 * Uses its own DB pool (same pattern as cycleService.js) so it can
 * be imported by workers without circular dependency on app.js.
 */
import dotenv from 'dotenv';
import { ServerClient } from 'postmark';
import Twilio from 'twilio';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

// ── Postmark client ────────────────────────────────────────────
const postmark = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

// ── Twilio client ──────────────────────────────────────────────
const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || '';

// Sender address used in the From header for outgoing emails.
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'noreply@mtc3portal.com';

// ── Low-level senders ──────────────────────────────────────────

export async function sendEmail(to, subject, htmlBody) {
  try {
    await postmark.sendEmail({
      From: FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
    });
    console.log(`[notify] email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[notify] email failed for ${to}:`, err.message);
  }
}

export async function sendSms(to, body) {
  if (!to) return;
  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_FROM,
      to,
    });
    console.log(`[notify] SMS sent to ${to}`);
  } catch (err) {
    console.error(`[notify] SMS failed for ${to}:`, err.message);
  }
}

// ── Preference-aware helpers ───────────────────────────────────

/**
 * Parse the notification_settings JSON from the DB.
 * Returns an object with { channel, module_open, ... } or defaults.
 */
function parseSettings(raw) {
  if (!raw) return { channel: 'both' };
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return { channel: 'both' }; }
  }
  return raw;
}

/**
 * Send a notification to a single user, respecting their channel preference.
 *
 * @param {object} user  - must include `email`, `user_phone`, `notification_settings`
 * @param {string} subject
 * @param {string} htmlBody
 * @param {string} smsBody
 */
export async function notifyUser(user, subject, htmlBody, smsBody) {
  const settings = parseSettings(user.notification_settings);
  const channel = settings.channel || 'both';

  if (channel === 'none') return;

  const promises = [];

  if ((channel === 'email' || channel === 'both') && user.email) {
    promises.push(sendEmail(user.email, subject, htmlBody));
  }

  if ((channel === 'sms' || channel === 'both') && user.user_phone) {
    promises.push(sendSms(user.user_phone, smsBody));
  }

  await Promise.allSettled(promises);
}

/**
 * Send notifications to many users.
 *
 * @param {object[]} users
 * @param {string}   subject
 * @param {function} htmlBodyFn  - (user) => string
 * @param {function} smsBodyFn   - (user) => string
 */
export async function notifyUsers(users, subject, htmlBodyFn, smsBodyFn) {
  for (const user of users) {
    await notifyUser(user, subject, htmlBodyFn(user), smsBodyFn(user));
  }
}
