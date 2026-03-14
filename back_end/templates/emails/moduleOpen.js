// import { generateEmailDecorations } from './svgAssets.js';

export function moduleOpenEmail({ userName, workshopName, moduleName, appUrl, userId }) {
  const subject = `[TEST] MODULE_OPEN — ${workshopName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: MODULE_OPEN</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Workshop:</strong> ${workshopName}</p>
  <p><strong>Module:</strong> ${moduleName}</p>
  <p><a href="${appUrl}">Go to module</a></p>
</body></html>`;

  return { subject, html };
}
