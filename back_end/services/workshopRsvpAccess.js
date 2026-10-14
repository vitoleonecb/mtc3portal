export function workshopRsvpAccessError(user, targetUserId) {
  if (!user.is_admin && Number(user.user_id) !== Number(targetUserId)) {
    return { status: 403, error: "Cannot access another user's RSVP" };
  }
  if (!user.is_admin && (user.user_type === 'guest' || !user.email_verified)) {
    return { status: 403, error: 'Verify your email to access and confirm your workshop RSVP', code: 'EMAIL_VERIFICATION_REQUIRED' };
  }
  return null;
}
