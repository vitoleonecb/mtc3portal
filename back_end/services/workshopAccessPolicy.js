export async function getPromptContext(connection, promptId) {
  const [[prompt]] = await connection.query(
    `SELECT wp.workshop_prompt_id AS promptId,
            wp.prompt_template_id AS templateId,
            wm.workshop_module_id AS moduleId,
            wm.workshop_module_status AS moduleStatus,
            wm.workshop_id AS workshopId
     FROM workshop_prompts wp
     JOIN workshop_modules wm ON wm.workshop_module_id = wp.workshop_module_id
     WHERE wp.workshop_prompt_id = ?`,
    [promptId]
  );
  return prompt || null;
}

export function promptMatchesRoute(prompt, workshopId, moduleId) {
  return prompt && Number(prompt.workshopId) === Number(workshopId)
    && Number(prompt.moduleId) === Number(moduleId);
}

export async function hasAnsweredPrompt(connection, userId, promptId) {
  const [rows] = await connection.query(
    'SELECT 1 FROM workshop_responses WHERE user_id = ? AND workshop_prompt_id = ? LIMIT 1',
    [userId, promptId]
  );
  return rows.length > 0;
}

export async function canViewWorkshopMaterials(connection, workshopId, isAdmin) {
  if (isAdmin) return true;
  const [[counts]] = await connection.query(
    `SELECT COUNT(*) AS moduleCount,
            SUM(workshop_module_status = 'completed') AS completedCount
     FROM workshop_modules WHERE workshop_id = ?`,
    [workshopId]
  );
  return Number(counts.moduleCount) > 0
    && Number(counts.completedCount) === Number(counts.moduleCount);
}

export function requireCommunityAccess(connection) {
  return async (req, res, next) => {
    try {
      if (req.user.user_type === 'guest') {
        return res.status(403).json({ error: 'Create an account to view community results.' });
      }
      const prompt = await getPromptContext(connection, req.params.promptId);
      if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
      if (!req.user.is_admin && !await hasAnsweredPrompt(connection, req.user.user_id, prompt.promptId)) {
        return res.status(403).json({ error: 'Respond to this prompt before viewing community results.' });
      }
      next();
    } catch (error) {
      console.error('Community access check error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
