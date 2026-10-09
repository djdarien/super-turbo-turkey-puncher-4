// Cloudflare Worker: Stripe pay-what-you-want ($1 min) paywall in front of the game.
// All static files live in /public and are served ONLY through this worker (run_worker_first).
import { signToken, verifyToken, sessionGrantsAccess, verifyStripeSignature, getCookie, TOKEN_TTL_SECONDS } from './auth.js';

const COOKIE = 'sttp_access';
const PUBLIC_PATHS = new Set(['/', '/index.html', '/landing.css', '/favicon.ico']);
const STRIPE_API = 'https://api.stripe.com/v1';

async function stripe(env, method, path, form) {
  const res = await fetch(STRIPE_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form ? new URLSearchParams(form).toString() : undefined
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${res.status}`);
  return json;
}

function minCents(env) { return Number(env.MIN_PRICE_CENTS || 100); }

async function grantAndRedirect(env, sessionId) {
  const token = await signToken(env.ACCESS_TOKEN_SECRET, sessionId);
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/play/',
      'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${TOKEN_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    }
  });
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Start checkout: Checkout Session using a "customer chooses price" Price (min $1 set in Stripe).
  if (path === '/checkout' && request.method === 'POST') {
    const session = await stripe(env, 'POST', '/checkout/sessions', {
      mode: 'payment',
      'line_items[0][price]': env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/`
    });
    return Response.redirect(session.url, 303);
  }

  // Return from Stripe (also usable to restore access on a new device with the same session id).
  if (path === '/success' || path === '/restore') {
    const sid = url.searchParams.get('session_id') || '';
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sid)) return new Response('Invalid session id', { status: 400 });
    let session;
    try { session = await stripe(env, 'GET', `/checkout/sessions/${encodeURIComponent(sid)}`); }
    catch (_) { return new Response('Could not verify payment', { status: 402 }); }
    if (!sessionGrantsAccess(session, minCents(env))) return new Response('Payment not completed', { status: 402 });
    return grantAndRedirect(env, sid);
  }

  // Webhook: verified for authenticity; access itself is stateless (signed cookie), so this only logs.
  if (path === '/webhook' && request.method === 'POST') {
    const raw = await request.text();
    const ok = await verifyStripeSignature(raw, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
    if (!ok) return new Response('Bad signature', { status: 400 });
    const event = JSON.parse(raw);
    if (event.type === 'checkout.session.completed') {
      console.log('paid session', event.data?.object?.id, event.data?.object?.amount_total);
    }
    return new Response('ok');
  }

  if (path === '/logout') {
    return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (PUBLIC_PATHS.has(path)) return env.ASSETS.fetch(request);

  // Everything else (the game) requires a valid signed access cookie.
  const valid = await verifyToken(env.ACCESS_TOKEN_SECRET, getCookie(request, COOKIE));
  if (!valid) {
    return new Response(null, { status: 302, headers: { Location: '/?locked=1' } });
  }
  const res = await env.ASSETS.fetch(request);
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'private, no-store');
  return out;
}

export default {
  fetch: (req, env) => handle(req, env).catch(e => {
    console.error(e);
    return new Response('Something went wrong. Please try again.', { status: 500 });
  })
};
