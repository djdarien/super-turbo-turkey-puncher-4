// Integration tests of the Worker with a stubbed Stripe API and stubbed static-assets binding.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.js';

const env = {
  STRIPE_SECRET_KEY: 'sk_test_stub', STRIPE_WEBHOOK_SECRET: 'whsec_stub', STRIPE_PRICE_ID: 'price_stub',
  ACCESS_TOKEN_SECRET: 'tok', MIN_PRICE_CENTS: '100',
  ASSETS: { fetch: req => new Response('ASSET ' + new URL(req.url).pathname, { status: 200 }) }
};
const sessions = {
  cs_test_paid: { id: 'cs_test_paid', object: 'checkout.session', mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: 300 },
  cs_test_unpaid: { id: 'cs_test_unpaid', object: 'checkout.session', mode: 'payment', status: 'open', payment_status: 'unpaid', amount_total: 0 }
};
let lastCreate;
globalThis.fetch = async (url, opts) => {
  const u = new URL(url);
  if (u.pathname === '/v1/checkout/sessions' && opts.method === 'POST') {
    lastCreate = new URLSearchParams(opts.body);
    return Response.json({ id: 'cs_test_new', url: 'https://checkout.stripe.com/c/pay/cs_test_new' });
  }
  const id = u.pathname.split('/').pop();
  return sessions[id] ? Response.json(sessions[id]) : Response.json({ error: { message: 'No such session' } }, { status: 404 });
};
const req = (p, init) => new Request('https://game.example' + p, init);

test('landing is public, game is locked without cookie', async () => {
  assert.equal(await (await handle(req('/'), env)).text(), 'ASSET /');
  for (const p of ['/play/', '/play/game.js', '/play/turkey.png', '/anything']) {
    const r = await handle(req(p), env);
    assert.equal(r.status, 302); assert.equal(r.headers.get('Location'), '/?locked=1');
  }
});
test('checkout creates a session with the PWYW price and redirects to Stripe', async () => {
  const r = await handle(req('/checkout', { method: 'POST' }), env);
  assert.equal(r.status, 303);
  assert.match(r.headers.get('Location'), /^https:\/\/checkout\.stripe\.com/);
  assert.equal(lastCreate.get('line_items[0][price]'), 'price_stub');
  assert.equal(lastCreate.get('mode'), 'payment');
  assert.match(lastCreate.get('success_url'), /\/success\?session_id=\{CHECKOUT_SESSION_ID\}$/);
});
test('paid session -> cookie -> game unlocked', async () => {
  const r = await handle(req('/success?session_id=cs_test_paid'), env);
  assert.equal(r.status, 303); assert.equal(r.headers.get('Location'), '/play/');
  const cookie = r.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  const g = await handle(req('/play/game.js', { headers: { Cookie: cookie.split(';')[0] } }), env);
  assert.equal(g.status, 200); assert.equal(await g.text(), 'ASSET /play/game.js');
  assert.equal(g.headers.get('Cache-Control'), 'private, no-store');
});
test('unpaid, unknown, malformed session ids and forged cookies are refused', async () => {
  assert.equal((await handle(req('/success?session_id=cs_test_unpaid'), env)).status, 402);
  assert.equal((await handle(req('/success?session_id=cs_test_nope'), env)).status, 402);
  assert.equal((await handle(req('/success?session_id=../../x'), env)).status, 400);
  const f = await handle(req('/play/', { headers: { Cookie: 'sttp_access=eyJzaWQiOiJ4IiwiZXhwIjo5OTk5OTk5OTk5fQ.AAAA' } }), env);
  assert.equal(f.status, 302);
});
test('webhook rejects bad signatures', async () => {
  const r = await handle(req('/webhook', { method: 'POST', body: '{}', headers: { 'Stripe-Signature': 't=1,v1=00' } }), env);
  assert.equal(r.status, 400);
});
