import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidShowcaseTicketPayment, SHOWCASE_TICKET_AMOUNT } from '../services/showcaseTicketPayment.js';

const paidIntent = {
  id: 'pi_test123',
  status: 'succeeded',
  amount: SHOWCASE_TICKET_AMOUNT,
  amount_received: SHOWCASE_TICKET_AMOUNT,
  currency: 'usd',
  metadata: { type: 'showcase_ticket', showcase_id: '6', user_id: '42' },
};

test('only the paid ticket intent for this user and showcase is accepted', () => {
  assert.equal(isValidShowcaseTicketPayment(paidIntent, 6, 42), true);
  assert.equal(isValidShowcaseTicketPayment(paidIntent, 7, 42), false);
  assert.equal(isValidShowcaseTicketPayment(paidIntent, 6, 43), false);
  assert.equal(isValidShowcaseTicketPayment({ ...paidIntent, status: 'processing' }, 6, 42), false);
  assert.equal(isValidShowcaseTicketPayment({ ...paidIntent, amount_received: 0 }, 6, 42), false);
  assert.equal(isValidShowcaseTicketPayment({ ...paidIntent, amount: 100 }, 6, 42), false);
  assert.equal(isValidShowcaseTicketPayment({ ...paidIntent, currency: 'eur' }, 6, 42), false);
  assert.equal(isValidShowcaseTicketPayment({ ...paidIntent, id: undefined }, 6, 42), false);
  assert.equal(isValidShowcaseTicketPayment({ ...paidIntent, metadata: { ...paidIntent.metadata, type: 'subscription' } }, 6, 42), false);
  assert.equal(isValidShowcaseTicketPayment(null, 6, 42), false);
});
