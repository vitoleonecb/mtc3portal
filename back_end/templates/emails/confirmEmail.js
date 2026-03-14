// import { generateEmailDecorations } from './svgAssets.js';

export function confirmEmailTemplate({ userName, email, confirmUrl, userId }) {
  const subject = '[TEST] CONFIRM_EMAIL — MTC3';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: CONFIRM_EMAIL</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><a href="${confirmUrl}">Confirm email</a></p>
</body></html>`;

  return { subject, html };
}
