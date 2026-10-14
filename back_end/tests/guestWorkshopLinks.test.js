import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createGuestWorkshopToken, guestWorkshopContinueUrl, guestWorkshopRegistrationUrl, verifyGuestWorkshopToken } from '../services/guestWorkshopLinks.js';

test('partial-save continue link identifies the exact workshop', () => {
  assert.equal(
    guestWorkshopContinueUrl('https://example.test/', 42),
    'https://example.test/?workshopId=42#workshop-preview'
  );
  assert.equal(
    guestWorkshopContinueUrl('https://example.test/app', '7'),
    'https://example.test/?workshopId=7#workshop-preview'
  );
});

test('continue link rejects missing or invalid workshop IDs', () => {
  assert.throws(() => guestWorkshopContinueUrl('https://example.test', undefined));
  assert.throws(() => guestWorkshopContinueUrl('https://example.test', -1));
});

test('registration link retains workshop identity for local answer import', () => {
  const token = createGuestWorkshopToken('test-secret', {
    userId: 9, email: 'visitor+test@example.test', workshopId: 42,
  });
  const url = new URL(guestWorkshopRegistrationUrl('https://example.test/', {
    workshopId: 42, token,
  }));
  assert.equal(url.pathname, '/register');
  assert.equal(url.searchParams.get('guestToken'), token);
  assert.equal(url.searchParams.get('previewWorkshopId'), '42');
  assert.equal(verifyGuestWorkshopToken(token, 'test-secret').email, 'visitor+test@example.test');
  assert.equal(verifyGuestWorkshopToken(token, 'test-secret').workshopId, 42);
  assert.equal(verifyGuestWorkshopToken(token, 'wrong-secret'), null);
  assert.equal(verifyGuestWorkshopToken('bad-token', 'test-secret'), null);
  const expired = jwt.sign({ purpose: 'guest_workshop', userId: 9, email: 'visitor@example.test', workshopId: 42 }, 'test-secret', { expiresIn: -1 });
  assert.equal(verifyGuestWorkshopToken(expired, 'test-secret'), null);
  const continueUrl = new URL(guestWorkshopContinueUrl('https://example.test', 42, token));
  assert.equal(continueUrl.searchParams.get('workshopId'), '42');
  assert.equal(continueUrl.searchParams.get('guestToken'), token);
});
