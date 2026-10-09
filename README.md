# Super Turbo Turkey Puncher 4

*(To rename: edit `public/play/config.js`, the `<title>`/meta in `public/play/index.html` and `public/index.html`, and the logo text in `tools/art.py`.)*

A gritty retro autumn arcade game: aim your glove, punch the bouncing turkeys, chain combos, grab power-ups, climb the leaderboard.

## Play

The game lives in `public/play/` and is sold pay-what-you-want ($1 minimum) through Stripe, served by a Cloudflare Worker paywall. See [DEPLOY.md](DEPLOY.md).

For local development without the paywall, serve the repo root and open `public/play/index.html`.

## Features

- Moving turkeys with increasing difficulty & HP
- Combo system with score multipliers
- Thanksgiving power-ups: Pumpkin Pie (bonus points), Stuffing (slow time), Cranberry (fast time), Gravy Boat (+1 life)
- Screen shake + feather particles
- Responsive (desktop + mobile/touch)
- 3 lives: a turkey not punched in time escapes and costs a life
- Local high scores
- Pause (Esc / P)

## Controls

- Move mouse / finger → aim fist
- Click / tap → punch
- Esc or P → pause

## Support

An optional extra tip link (PayPal) is shown on the title and game-over screens. It is purely optional and is not how the game is purchased.

## Credits

See [CREDITS.md](CREDITS.md). All art and audio are original.
