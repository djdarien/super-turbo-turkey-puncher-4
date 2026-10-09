import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { signToken, verifyToken, sessionGrantsAccess, verifyStripeSignature } from '../src/auth.js';

const S = 'test-secret';
const paid = { object: 'checkout.session', mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: 100 };

test('valid token round-trips', async () => {
  const t = await signToken(S, 'cs_test_1', 1000);
  assert.equal((await verifyToken(S, t, 1001)).sid, 'cs_test_1');
});
test('expired token rejected', async () => {
  const t = await signToken(S, 'cs_test_1', 1000, 10);
  assert.equal(await verifyToken(S, t, 1011), null);
});
test('tampered / wrong-secret / garbage tokens rejected', async () => {
  const t = await signToken(S, 'cs_test_1', 1000);
  const [p, s] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ sid: 'x', exp: 9e9 })).toString('base64url');
  assert.equal(await verifyToken(S, `${forged}.${s}`, 1001), null);
  assert.equal(await verifyToken('other', t, 1001), null);
  for (const g of [null, '', 'abc', 'a.b.c', '%%.%%', `${p}.`]) assert.equal(await verifyToken(S, g, 1001), null);
  assert.equal(await verifyToken('', t, 1001), null);
});
test('session access rules', () => {
  assert.equal(sessionGrantsAccess(paid), true);
  assert.equal(sessionGrantsAccess({ ...paid, amount_total: 500 }), true);
  assert.equal(sessionGrantsAccess({ ...paid, amount_total: 99 }), false);
  assert.equal(sessionGrantsAccess({ ...paid, payment_status: 'unpaid' }), false);
  assert.equal(sessionGrantsAccess({ ...paid, status: 'open' }), false);
  assert.equal(sessionGrantsAccess({ ...paid, mode: 'subscription' }), false);
  assert.equal(sessionGrantsAccess(null), false);
});
test('stripe webhook signature', async () => {
  const body = '{"type":"checkout.session.completed"}', sec = 'whsec_x', t = 5000;
  const v1 = createHmac('sha256', sec).update(`${t}.${body}`).digest('hex');
  assert.equal(await verifyStripeSignature(body, `t=${t},v1=${v1}`, sec, 300, t + 10), true);
  assert.equal(await verifyStripeSignature(body + ' ', `t=${t},v1=${v1}`, sec, 300, t + 10), false);
  assert.equal(await verifyStripeSignature(body, `t=${t},v1=${v1}`, sec, 300, t + 1000), false);
  assert.equal(await verifyStripeSignature(body, `t=${t},v1=${v1}`, 'whsec_y', 300, t + 10), false);
  assert.equal(await verifyStripeSignature(body, null, sec), false);
});
