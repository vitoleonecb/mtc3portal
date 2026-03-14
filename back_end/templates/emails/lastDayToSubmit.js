// import { generateEmailDecorations } from './svgAssets.js';

export function lastDayToSubmitEmail({ userName, workshopName, moduleName, deadlineDate, appUrl, userId }) {
  const subject = `[TEST] LAST_DAY_TO_SUBMIT — ${workshopName}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: LAST_DAY_TO_SUBMIT</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Workshop:</strong> ${workshopName}</p>
  <p><strong>Module:</strong> ${moduleName}</p>
  <p><strong>Deadline:</strong> ${deadlineDate}</p>
  <p><a href="${appUrl}">Submit now</a></p>
</body></html>`;

  return { subject, html };
}
