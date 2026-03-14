// import { generateEmailDecorations } from './svgAssets.js';

export function newShowcaseEmail({ userName, showcaseName, showcaseDate, showcaseLocation, purchaseUrl, userId }) {
  const subject = `[TEST] NEW_SHOWCASE — ${showcaseName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: NEW_SHOWCASE</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Showcase:</strong> ${showcaseName}</p>
  <p><strong>Date:</strong> ${showcaseDate}</p>
  <p><strong>Location:</strong> ${showcaseLocation}</p>
  <p><a href="${purchaseUrl}">Get ticket</a></p>
</body></html>`;

  return { subject, html };
}
