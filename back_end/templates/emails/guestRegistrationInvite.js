export function guestRegistrationInviteEmail({ userName, email, registerUrl, userId }) {
  const subject = '[TEST] GUEST_REGISTRATION_INVITE — MTC3';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: GUEST_REGISTRATION_INVITE</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Email:</strong> ${email}</p>
  <p>Your responses have been saved! Complete your account to unlock full access — set your username, password, and avatar.</p>
  <p><a href="${registerUrl}">Complete your account</a></p>
</body></html>`;

  return { subject, html };
}
