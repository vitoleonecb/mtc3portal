import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canViewWorkshopMaterials,
  getPromptContext,
  hasAnsweredPrompt,
  promptMatchesRoute,
  requireCommunityAccess,
} from '../services/workshopAccessPolicy.js';
import { ensureWorkshopRsvpForCompletedPrompts } from '../services/rsvpService.js';

const prompt = {
  promptId: 115,
  templateId: 1,
  moduleId: 88,
  moduleStatus: 'open',
  workshopId: 54,
};

test('prompt lookup and route identity stay scoped to one workshop and module', async () => {
  const connection = { query: async () => [[prompt]] };
  assert.deepEqual(await getPromptContext(connection, 115), prompt);
  assert.ok(promptMatchesRoute(prompt, 54, 88));
  assert.equal(promptMatchesRoute(prompt, 53, 88), false);
  assert.equal(promptMatchesRoute(prompt, 54, 87), false);
});

test('community access requires an answer for participants and bypasses admins', async () => {
  const connection = {
    query: async (sql) => sql.includes('FROM workshop_prompts wp') ? [[prompt]] : [[]],
  };
  assert.equal(await hasAnsweredPrompt(connection, 10, 115), false);
  const gate = requireCommunityAccess(connection);
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let passed = false;
  await gate({ params: { promptId: '115' }, user: { user_id: 10, is_admin: false } }, response, () => { passed = true; });
  assert.equal(response.statusCode, 403);
  assert.equal(passed, false);

  await gate({ params: { promptId: '115' }, user: { user_id: 12, user_type: 'guest', is_admin: false } }, response, () => { passed = true; });
  assert.equal(response.statusCode, 403);
  assert.equal(passed, false);

  await gate({ params: { promptId: '115' }, user: { user_id: 11, is_admin: true } }, response, () => { passed = true; });
  assert.equal(passed, true);
});

test('participants see workshop materials only when every module is completed', async () => {
  const connection = { query: async () => [[{ moduleCount: 2, completedCount: 1 }]] };
  assert.equal(await canViewWorkshopMaterials(connection, 54, false), false);
  connection.query = async () => [[{ moduleCount: 2, completedCount: 2 }]];
  assert.equal(await canViewWorkshopMaterials(connection, 54, false), true);
  connection.query = async () => [[{ moduleCount: 0, completedCount: null }]];
  assert.equal(await canViewWorkshopMaterials(connection, 54, false), false);
  assert.equal(await canViewWorkshopMaterials(connection, 54, true), true);
});

test('RSVP remains locked when a module has no prompts or answers are incomplete', async () => {
  const queries = [];
  const connection = {
    query: async (sql) => {
      queries.push(sql);
      if (sql.includes('emptyModuleCount')) return [[{ moduleCount: 2, emptyModuleCount: 1 }]];
      if (sql.includes('requiredPromptCount')) return [[{ requiredPromptCount: 2 }]];
      if (sql.includes('completedPromptCount')) return [[{ completedPromptCount: 1 }]];
      throw new Error('Unexpected query');
    },
  };
  const result = await ensureWorkshopRsvpForCompletedPrompts({ connection, notificationQueue: {}, userId: 10, workshopId: 54 });
  assert.equal(result.eligible, false);
  assert.equal(queries.some((sql) => sql.includes('INSERT INTO workshop_rsvps')), false);
});

test('RSVP is created once after every workshop prompt is answered', async () => {
  let inserts = 0;
  const connection = {
    query: async (sql) => {
      if (sql.includes('emptyModuleCount')) return [[{ moduleCount: 2, emptyModuleCount: 0 }]];
      if (sql.includes('requiredPromptCount')) return [[{ requiredPromptCount: 3 }]];
      if (sql.includes('completedPromptCount')) return [[{ completedPromptCount: 3 }]];
      if (sql.includes('SELECT 1 FROM workshop_rsvps')) return [[]];
      if (sql.includes('INSERT INTO workshop_rsvps')) { inserts++; return [{ affectedRows: 1 }]; }
      throw new Error('Unexpected query');
    },
  };
  const jobs = [];
  const notificationQueue = { add: async (name, data) => jobs.push({ name, data }) };
  const result = await ensureWorkshopRsvpForCompletedPrompts({ connection, notificationQueue, userId: 10, workshopId: 54 });
  assert.equal(result.created, true);
  assert.equal(inserts, 1);
  assert.equal(jobs.length, 1);
});

test('a concurrent RSVP insert does not create a second RSVP or notice', async () => {
  const connection = {
    query: async (sql) => {
      if (sql.includes('emptyModuleCount')) return [[{ moduleCount: 2, emptyModuleCount: 0 }]];
      if (sql.includes('requiredPromptCount')) return [[{ requiredPromptCount: 3 }]];
      if (sql.includes('completedPromptCount')) return [[{ completedPromptCount: 3 }]];
      if (sql.includes('SELECT 1 FROM workshop_rsvps')) return [[]];
      if (sql.includes('INSERT INTO workshop_rsvps')) throw Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' });
      throw new Error('Unexpected query');
    },
  };
  let notices = 0;
  const result = await ensureWorkshopRsvpForCompletedPrompts({
    connection, notificationQueue: { add: async () => { notices++; } }, userId: 10, workshopId: 54,
  });
  assert.equal(result.alreadyExists, true);
  assert.equal(result.created, false);
  assert.equal(notices, 0);
});
