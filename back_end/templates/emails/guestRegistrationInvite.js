export function guestRegistrationInviteEmail({ userName, email, registerUrl, continueUrl, userId, workshopName, rsvpEarned = false }) {
  const subject = rsvpEarned ? '[TEST] WORKSHOP_RSVP_EARNED_GUEST — MTC3' : '[TEST] GUEST_WORKSHOP_INCOMPLETE — MTC3';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
  <h2>Template: GUEST_REGISTRATION_INVITE</h2>
  <p><strong>User:</strong> ${userName} (ID ${userId})</p>
  <p><strong>Email:</strong> ${email}</p>
  <p>Your responses${workshopName ? ` for ${workshopName}` : ''} have been saved.</p>
  ${rsvpEarned
    ? `<p>You have earned a workshop RSVP. Create your account and verify your email to access and confirm it. Your workshop location is available after verification.</p><p><a href="${registerUrl}">Create your account</a></p>`
    : `<p>Complete the remaining workshop modules to earn an RSVP and see the workshop location after account creation.</p><p><a href="${continueUrl}">Continue the current workshop</a></p><p><a href="${registerUrl}">Create your account</a></p>`}
</body></html>`;

  return { subject, html };
}
