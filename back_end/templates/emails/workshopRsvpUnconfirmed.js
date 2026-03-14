// import { generateEmailDecorations } from './svgAssets.js';

export function workshopRsvpUnconfirmedEmail({ userName, workshopName, rsvpUrl, userId }) {
  const subject = `[TEST] WORKSHOP_RSVP_UNCONFIRMED — ${workshopName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: WORKSHOP_RSVP_UNCONFIRMED</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Workshop:</strong> ${workshopName}</p>
  <p><a href="${rsvpUrl}">Confirm RSVP</a></p>
</body></html>`;

  return { subject, html };
}
