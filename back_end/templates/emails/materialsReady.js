// import { generateEmailDecorations } from './svgAssets.js';

export function materialsReadyEmail({ userName, workshopName, materialsUrl, userId }) {
  const subject = `[TEST] MATERIALS_READY — ${workshopName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: MATERIALS_READY</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Workshop:</strong> ${workshopName}</p>
  <p><a href="${materialsUrl}">View materials</a></p>
</body></html>`;

  return { subject, html };
}
