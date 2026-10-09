# Deploying Super Turbo Turkey Puncher 4 (pay-what-you-want, $1 minimum)

## Architecture

```
Player ──► Cloudflare Worker (src/index.js) ──► static files in /public (Workers Static Assets)
                 │   run_worker_first = true: EVERY request passes the access check
                 ├─ GET  /            landing / paywall page (public)
                 ├─ POST /checkout    creates a Stripe Checkout Session (customer-chooses-price, min $1) → redirect to Stripe
                 ├─ GET  /success     retrieves the session from Stripe; if complete + paid + >= $1,
                 │                    sets an HMAC-signed HttpOnly cookie (valid 1 year) → /play/
                 ├─ GET  /restore?session_id=cs_...   same check, to unlock another browser
                 ├─ POST /webhook     verifies Stripe-Signature (STRIPE_WEBHOOK_SECRET), logs paid sessions
                 └─ GET  /play/*      the game; served only with a valid signed cookie, else 302 → /?locked=1
```

Why Cloudflare Workers: the free plan (100k requests/day) covers this game, static assets are free and
served from the same deployment, `run_worker_first` puts the game files behind the check, there is no
cold start, and no database is needed because access is a stateless signed cookie.
Vercel or Netlify would also work, but gating their static files means rewriting every asset through a function.

## 1. Stripe (start in Test mode, then repeat in Live mode)

1. Create or log in to a Stripe account at https://dashboard.stripe.com and finish account activation (business details and bank account) before going live.
2. Go to **Product catalog → Add product**:
   - Name: `Super Turbo Turkey Puncher 4`
   - Pricing: **One-off**, choose **Customer chooses price**
   - Currency USD, **Minimum amount $1.00**, and optionally a suggested amount (e.g. $3) and a maximum.
   - Save, then copy the **Price ID** (`price_...`) → `STRIPE_PRICE_ID`.
3. Go to **Developers → API keys** and copy the **Secret key** (`sk_test_...` / `sk_live_...`) → `STRIPE_SECRET_KEY`.
   You can use a **restricted key** with *Checkout Sessions: Write*.
4. After the first deploy (step 3 below), go to **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-domain>/webhook`
   - Events: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

## 2. Environment variables / secrets

| Name | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks endpoint signing secret |
| `STRIPE_PRICE_ID` | the customer-chooses-price Price ID |
| `ACCESS_TOKEN_SECRET` | any long random string: `openssl rand -hex 32` (rotating it logs everyone out) |
| `MIN_PRICE_CENTS` | plain var in `wrangler.toml`, default `100`; keep it equal to the Stripe minimum |

Never commit real values. `.env.example` lists them, and `.dev.vars` / `.env` are git-ignored.

## 3. Cloudflare hosting

Requires Node.js 22 or later (Wrangler 4).

```bash
npm install
npx wrangler login                     # free Cloudflare account
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PRICE_ID
npx wrangler secret put ACCESS_TOKEN_SECRET
npx wrangler deploy                    # → https://super-turbo-turkey-puncher-4.<you>.workers.dev
```

Custom domain (optional): Cloudflare dashboard → Workers & Pages → the worker → Settings → Domains & Routes →
Add custom domain (the domain must be on Cloudflare DNS). Then update the Stripe webhook URL.

## 4. Local testing

```bash
npm test                                # unit + integration tests (Stripe is stubbed; no keys needed)
cp .env.example .dev.vars               # put sk_test_ keys here for a real test-mode checkout
npx wrangler dev                        # http://localhost:8787
stripe listen --forward-to localhost:8787/webhook   # optional, Stripe CLI
```

Use test card `4242 4242 4242 4242` with any future expiry date and any CVC.

## 5. Important: the GitHub repo is public, and so is GitHub Pages

- **GitHub Pages**: `main` currently deploys the whole repo to GitHub Pages on every push. If this branch is ever
  merged to `main`, `/public/play/` would become freely playable at `djdarien.github.io`. Before merging, disable
  Pages (Settings → Pages) or remove `.github/workflows/static.yml`.
- **Source visibility**: while the repository is public, anyone can download the game files from GitHub.
  For a paid game, make the repo private (or keep the game in a private repo) before launch. The paywall only
  protects the hosted copy.

## Known limitations

- Access is per browser (cookie). Players who switch devices can use `/restore?session_id=cs_...`.
  The session ID is in the Stripe success URL, and you can look it up in the Stripe dashboard for support requests.
  Anyone holding a paid session ID can unlock a browser with it.
- Refunds do not revoke existing cookies (it's a stateless design). Rotate `ACCESS_TOKEN_SECRET` to revoke everyone.
