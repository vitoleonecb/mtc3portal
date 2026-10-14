import test from 'node:test';
import assert from 'node:assert/strict';
import { workshopRsvpAccessError } from '../services/workshopRsvpAccess.js';

test('unverified owner cannot access or confirm an RSVP', () => {
  assert.equal(workshopRsvpAccessError({ user_id: 10, user_type: 'user', email_verified: false }, 10)?.code, 'EMAIL_VERIFICATION_REQUIRED');
  assert.equal(workshopRsvpAccessError({ user_id: 10, user_type: 'guest', email_verified: true }, 10)?.code, 'EMAIL_VERIFICATION_REQUIRED');
});

test('verified owner and admin may access RSVPs, but another user may not', () => {
  assert.equal(workshopRsvpAccessError({ user_id: 10, user_type: 'user', email_verified: true }, 10), null);
  assert.equal(workshopRsvpAccessError({ user_id: 1, is_admin: true, email_verified: false }, 10), null);
  assert.equal(workshopRsvpAccessError({ user_id: 11, user_type: 'user', email_verified: true }, 10)?.status, 403);
});
