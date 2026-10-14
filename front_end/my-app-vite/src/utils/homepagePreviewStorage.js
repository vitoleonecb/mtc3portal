const STORAGE_PREFIX = "homepagePreviewResponses";

export const previewStorageKey = (workshopId) => `${STORAGE_PREFIX}:${workshopId}`;
export const promptStorageKey = (moduleId, promptId) => `${moduleId}:${promptId}`;

export function readPreviewResponses(workshopId, openModules) {
  if (!workshopId || typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(previewStorageKey(workshopId)) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const allowed = openModules
      ? new Map(openModules.flatMap((module) =>
          module.prompts.map((prompt) => [promptStorageKey(module.moduleId, prompt.promptId), prompt.templateId])
        ))
      : null;
    const responses = {};
    for (const [key, value] of Object.entries(parsed)) {
      const match = key.match(/^(\d+):(\d+)$/);
      if (!match || !value || typeof value !== "object" || value.content == null) continue;
      const moduleId = Number(match[1]);
      const promptId = Number(match[2]);
      if (Number(value.promptId) !== promptId || (value.moduleId != null && Number(value.moduleId) !== moduleId)) continue;
      if (allowed && (!allowed.has(key) || Number(allowed.get(key)) !== Number(value.templateId))) continue;
      responses[key] = {
        moduleId,
        promptId,
        templateId: Number(value.templateId),
        content: value.content,
      };
    }
    return responses;
  } catch (error) {
    console.warn("Unable to read homepage preview responses:", error);
    return {};
  }
}

export function removePreviewResponses(workshopId, keys) {
  if (!workshopId || typeof window === "undefined") return;
  if (!keys) {
    window.localStorage.removeItem(previewStorageKey(workshopId));
    return;
  }
  const remaining = readPreviewResponses(workshopId);
  keys.forEach((key) => { delete remaining[key]; });
  if (Object.keys(remaining).length) {
    window.localStorage.setItem(previewStorageKey(workshopId), JSON.stringify(remaining));
  } else {
    window.localStorage.removeItem(previewStorageKey(workshopId));
  }
}
