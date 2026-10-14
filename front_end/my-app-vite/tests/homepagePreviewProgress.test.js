import test from 'node:test';
import assert from 'node:assert/strict';
import { allAvailablePromptsAnswered, moduleProgress, nextUnansweredModuleIndex, nextUnansweredPromptIndex } from '../src/utils/homepagePreviewProgress.js';

const modules = [
  { moduleId: 1, prompts: [{ promptId: 10 }, { promptId: 11 }] },
  { moduleId: 2, prompts: [{ promptId: 20 }, { promptId: 21 }, { promptId: 22 }] },
];

test('completed modules are marked done and resume skips to the first unfinished prompt', () => {
  const answered = new Set([10, 11, 20, 22]);
  const hasResponse = (_module, prompt) => answered.has(prompt.promptId);

  assert.deepEqual(moduleProgress(modules[0], hasResponse), { left: 0, complete: true });
  assert.deepEqual(moduleProgress(modules[1], hasResponse), { left: 1, complete: false });
  assert.equal(nextUnansweredModuleIndex(modules, hasResponse), 1);
  assert.equal(nextUnansweredPromptIndex(modules[1], hasResponse), 1);
  assert.equal(allAvailablePromptsAnswered(modules, hasResponse), false);
  answered.add(21);
  assert.equal(allAvailablePromptsAnswered(modules, hasResponse), true);
});

test('all completed modules have no next unanswered prompt', () => {
  const hasResponse = () => true;
  assert.equal(nextUnansweredModuleIndex(modules, hasResponse), -1);
  assert.equal(nextUnansweredPromptIndex(modules[0], hasResponse), -1);
});
