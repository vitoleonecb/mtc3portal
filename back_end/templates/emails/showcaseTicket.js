// import { generateEmailDecorations } from './svgAssets.js';

export function showcaseTicketEmail({ userName, showcaseName, showcaseDate, showcaseLocation, ticketUrl, userId }) {
  const subject = `[TEST] SHOWCASE_TICKET — ${showcaseName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: SHOWCASE_TICKET</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Showcase:</strong> ${showcaseName}</p>
  <p><strong>Date:</strong> ${showcaseDate}</p>
  <p><strong>Location:</strong> ${showcaseLocation}</p>
  <p><a href="${ticketUrl}">View ticket</a></p>
</body></html>`;

  return { subject, html };
}
