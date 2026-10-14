import test from 'node:test';
import assert from 'node:assert/strict';
import {
  previewStorageKey,
  promptStorageKey,
  readPreviewResponses,
  removePreviewResponses,
} from '../src/utils/homepagePreviewStorage.js';

const values = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  },
};

test('restores only prompts in the current workshop module list', () => {
  values.clear();
  values.set(previewStorageKey(54), JSON.stringify({
    '88:115': { promptId: 115, templateId: 1, content: [{ optionId: 2 }] },
    '89:119': { promptId: 119, templateId: 7, content: { rating: 4 } },
    '87:112': { promptId: 112, templateId: 1, content: [{ optionId: 1 }] },
  }));
  values.set(previewStorageKey(53), JSON.stringify({
    '87:112': { promptId: 112, templateId: 1, content: [{ optionId: 1 }] },
  }));
  const modules = [
    { moduleId: 88, prompts: [{ promptId: 115, templateId: 1 }] },
    { moduleId: 89, prompts: [{ promptId: 119, templateId: 7 }] },
  ];
  const restored = readPreviewResponses(54, modules);
  assert.deepEqual(Object.keys(restored), [promptStorageKey(88, 115), promptStorageKey(89, 119)]);
  assert.deepEqual(restored['89:119'].content, { rating: 4 });
  assert.equal(restored['89:119'].moduleId, 89);
});

test('rejects stale prompt identity and template changes', () => {
  values.clear();
  values.set(previewStorageKey(54), JSON.stringify({
    '88:115': { promptId: 999, templateId: 1, content: [] },
    '88:116': { promptId: 116, templateId: 3, content: [] },
    '88:117': { moduleId: 89, promptId: 117, templateId: 4, content: [] },
  }));
  const modules = [{ moduleId: 88, prompts: [
    { promptId: 115, templateId: 1 },
    { promptId: 116, templateId: 4 },
    { promptId: 117, templateId: 4 },
  ] }];
  assert.deepEqual(readPreviewResponses(54, modules), {});
});

test('removes saved answers without clearing unanswered workshop data', () => {
  values.clear();
  values.set(previewStorageKey(54), JSON.stringify({
    '88:115': { promptId: 115, templateId: 1, content: [1] },
    '89:119': { promptId: 119, templateId: 7, content: { rating: 4 } },
  }));
  removePreviewResponses(54, ['88:115']);
  assert.deepEqual(Object.keys(readPreviewResponses(54)), ['89:119']);
  removePreviewResponses(54);
  assert.equal(values.has(previewStorageKey(54)), false);
});
