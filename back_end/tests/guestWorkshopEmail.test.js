import test from 'node:test';
import assert from 'node:assert/strict';
import { guestRegistrationInviteEmail } from '../templates/emails/guestRegistrationInvite.js';

const base = {
  userName: 'Visitor', email: 'visitor@example.test', userId: 10,
  workshopName: 'Current Workshop', registerUrl: 'https://example.test/register',
  continueUrl: 'https://example.test/#workshop-preview',
};

test('partial guest save asks the visitor to finish modules without promising an RSVP', () => {
  const { subject, html } = guestRegistrationInviteEmail({ ...base, rsvpEarned: false });
  assert.match(subject, /INCOMPLETE/);
  assert.match(html, /remaining workshop modules/);
  assert.match(html, /Continue the current workshop/);
  assert.doesNotMatch(html, /You have earned a workshop RSVP/);
});

test('completed guest save explains account activation and confirmation', () => {
  const { subject, html } = guestRegistrationInviteEmail({ ...base, rsvpEarned: true });
  assert.match(subject, /RSVP_EARNED/);
  assert.match(html, /earned a workshop RSVP/);
  assert.match(html, /Create your account and verify your email to access and confirm/);
  assert.doesNotMatch(html, /remaining workshop modules/);
});
