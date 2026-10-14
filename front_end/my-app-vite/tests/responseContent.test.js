import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeResponseItems } from '../src/utils/responseContent.js';

test('response cards accept array, object, and serialized response content', () => {
  const answer = { questionText: 'Prompt', answer: 'Response' };
  assert.deepEqual(normalizeResponseItems([answer]), [answer]);
  assert.deepEqual(normalizeResponseItems(answer), [answer]);
  assert.deepEqual(normalizeResponseItems(JSON.stringify([answer])), [answer]);
  assert.deepEqual(normalizeResponseItems(JSON.stringify(answer)), [answer]);
  assert.deepEqual(normalizeResponseItems(null), []);
});
