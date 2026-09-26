export async function ensureWorkshopRsvpForCompletedPrompts({
  connection,
  notificationQueue,
  userId,
  workshopId,
}) {
  const normalizedWorkshopId = Number(workshopId);
  const normalizedUserId = Number(userId);

  if (!normalizedWorkshopId || !normalizedUserId) {
    return { eligible: false, created: false, reason: 'missing_user_or_workshop' };
  }

  const [[{ requiredPromptCount }]] = await connection.query(
    `SELECT COUNT(DISTINCT wp.workshop_prompt_id) AS requiredPromptCount
     FROM workshop_modules wm
     JOIN workshop_prompts wp ON wp.workshop_module_id = wm.workshop_module_id
     WHERE wm.workshop_id = ?`,
    [normalizedWorkshopId]
  );

  const [[{ completedPromptCount }]] = await connection.query(
    `SELECT COUNT(DISTINCT wr.workshop_prompt_id) AS completedPromptCount
     FROM workshop_responses wr
     JOIN workshop_prompts wp ON wp.workshop_prompt_id = wr.workshop_prompt_id
     JOIN workshop_modules wm ON wm.workshop_module_id = wp.workshop_module_id
     WHERE wr.user_id = ?
       AND wm.workshop_id = ?`,
    [normalizedUserId, normalizedWorkshopId]
  );

  const required = Number(requiredPromptCount || 0);
  const completed = Number(completedPromptCount || 0);

  if (required === 0 || completed < required) {
    return {
      eligible: false,
      created: false,
      requiredPromptCount: required,
      completedPromptCount: completed,
    };
  }

  const [existingRsvp] = await connection.query(
    'SELECT 1 FROM workshop_rsvps WHERE user_id = ? AND workshop_id = ? LIMIT 1',
    [normalizedUserId, normalizedWorkshopId]
  );

  if (existingRsvp.length > 0) {
    return {
      eligible: true,
      created: false,
      alreadyExists: true,
      requiredPromptCount: required,
      completedPromptCount: completed,
    };
  }

  await connection.query(
    'INSERT INTO workshop_rsvps (user_id, workshop_id) VALUES (?, ?)',
    [normalizedUserId, normalizedWorkshopId]
  );

  try {
    await notificationQueue.add('workshopRsvpUnconfirmed', {
      userId: normalizedUserId,
      workshopId: normalizedWorkshopId,
    });
    console.log(`[queue] enqueued: queue=notification, jobName=workshopRsvpUnconfirmed, userId=${normalizedUserId}, workshopId=${normalizedWorkshopId}`);
  } catch (notifErr) {
    console.error('Failed to enqueue workshopRsvpUnconfirmed:', notifErr.message);
  }

  return {
    eligible: true,
    created: true,
    requiredPromptCount: required,
    completedPromptCount: completed,
  };
}
