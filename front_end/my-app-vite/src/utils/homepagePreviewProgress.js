export function moduleProgress(module, hasResponse) {
  const total = module.prompts.length;
  const answered = module.prompts.filter((prompt) => hasResponse(module, prompt)).length;
  return { left: total - answered, complete: total > 0 && answered === total };
}

export function nextUnansweredModuleIndex(modules, hasResponse) {
  return modules.findIndex((module) => module.prompts.some((prompt) => !hasResponse(module, prompt)));
}

export function nextUnansweredPromptIndex(module, hasResponse) {
  return module?.prompts?.findIndex((prompt) => !hasResponse(module, prompt)) ?? -1;
}

export function allAvailablePromptsAnswered(modules, hasResponse) {
  return modules.length > 0 && modules.every((module) => module.prompts.length > 0
    && module.prompts.every((prompt) => hasResponse(module, prompt)));
}
