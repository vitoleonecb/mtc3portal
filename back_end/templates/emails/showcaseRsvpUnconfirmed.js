// import { generateEmailDecorations } from './svgAssets.js';

export function showcaseRsvpUnconfirmedEmail({ userName, showcaseName, showcaseDate, showcaseLocation, confirmUrl, userId }) {
  const subject = `[TEST] SHOWCASE_RSVP_UNCONFIRMED — ${showcaseName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: SHOWCASE_RSVP_UNCONFIRMED</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Showcase:</strong> ${showcaseName}</p>
  <p><strong>Date:</strong> ${showcaseDate}</p>
  <p><strong>Location:</strong> ${showcaseLocation}</p>
  <p><a href="${confirmUrl}">Confirm RSVP</a></p>
</body></html>`;

  return { subject, html };
}
