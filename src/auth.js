// Pure access-check helpers (Web Crypto only; runs in Cloudflare Workers and Node 20+).
const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}
function hex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''); }

export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365;

/** Create a signed access token: base64url(payload).base64url(hmac). */
export async function signToken(secret, sessionId, nowSec = Math.floor(Date.now() / 1000), ttl = TOKEN_TTL_SECONDS) {
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET missing');
  const payload = b64url(enc.encode(JSON.stringify({ sid: sessionId, exp: nowSec + ttl })));
  const sig = b64url(await hmac(secret, payload));
  return `${payload}.${sig}`;
}

/** Returns the payload if the token is authentic and unexpired, else null. Never throws. */
export async function verifyToken(secret, token, nowSec = Math.floor(Date.now() / 1000)) {
  try {
    if (!secret || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = await hmac(secret, payload);
    if (!timingSafeEqual(expected, b64urlDecode(sig))) return null;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (typeof data.exp !== 'number' || data.exp <= nowSec || typeof data.sid !== 'string') return null;
    return data;
  } catch (_) {
    return null;
  }
}

/** A Checkout Session grants access only if it is a completed, paid, one-time payment of >= minCents. */
export function sessionGrantsAccess(session, minCents = 100) {
  return !!session &&
    session.object === 'checkout.session' &&
    session.mode === 'payment' &&
    session.status === 'complete' &&
    session.payment_status === 'paid' &&
    typeof session.amount_total === 'number' &&
    session.amount_total >= minCents;
}

/** Verify a Stripe webhook "Stripe-Signature" header (t=...,v1=...). */
export async function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300, nowSec = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const items = header.split(',').map(p => p.split('='));
  const t = Number((items.find(([k]) => k === 't') || [])[1]);
  const v1s = items.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!Number.isFinite(t) || !v1s.length) return false;
  if (Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = hex(await hmac(secret, `${t}.${rawBody}`));
  return v1s.some(v => timingSafeEqual(enc.encode(v), enc.encode(expected)));
}

export function getCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}
