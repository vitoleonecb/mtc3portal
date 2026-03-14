// import { generateEmailDecorations } from './svgAssets.js';

export function resetPasswordEmail({ userName, resetUrl, userId }) {
  const subject = '[TEST] RESET_PASSWORD — MTC3';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: RESET_PASSWORD</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><a href="${resetUrl}">Reset password</a></p>
</body></html>`;

  return { subject, html };
}
