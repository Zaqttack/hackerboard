# Hackerboard (RowdyHacks XII talk: build a website with AI)

## Status
`main` is built, deployed and being polished. Talk material (prompts, tags, `demo-start-2`, rehearsals) has NOT been started: nothing from "Talk plan" below happens until `main` is signed off.

Live: https://hackerboard.zaquariah.workers.dev (repo `Zaqttack/hackerboard`, public).

## Idea
A hacker board for RowdyHacks XII. The root page is projected on a desktop display: hero, QR code, and every attendee who joins appears as a floating bauble (animal emoji + name) pinned to a cork board. Design is a detective cork board / heist case file, original CSS/SVG only, no RowdyHacks art.

## Pages
- `/` board. Fixed 1920×1080 stage scaled to fit. Polls `GET /api/wall` every 4s. Hero with recruit counter (`FULL HOUSE 50 / 50` at the cap), QR card (encodes `origin + /join` at runtime), empty-state ghost, matter.js drift, red strings between tied baubles, density tiers, dings, 51st-join exit, reduced-motion variant.
- `/join` phone form: name only, 1 to 20 characters, live preview, Turnstile, every state from the design (typing, empty, submitting, rejected, unverified, network, success, already).
- `/admin` passphrase gate, stats (ON BOARD / RECRUITED), a list of everyone in join order with time since the first join (`+m:ss`) and an `OFF` marker for anyone bumped off the board, and a confirmed wipe.

## Stack
Vite, React 19, TypeScript, Tailwind v4, react-router-dom, matter-js, `qrcode.react`, `obscenity`, `@fontsource` fonts (bundled). One Cloudflare Worker (`src/worker/index.ts`) serving `/api/*` and static assets from `dist/`, D1 for data. pnpm. Vitest.

## API
- `GET /api/wall` the 50 newest `Entry` rows `{ id, name, emoji, fill, tiedTo, createdAt }`, oldest first.
- `POST /api/sign` `{ name, turnstileToken }`. Validates (trim, collapse spaces, strip control and zero-width characters, 1 to 20 code points), blocklist, Turnstile. Picks emoji, fill (never the previous entry's) and `tied_to`. 400 invalid, 422 rejected, 403 turnstile, 201 created. Never rejects because the board is full.
- `GET /api/me?id=` entry plus `onBoard` (false once 50 newer entries exist). 404 if the row is gone.
- `POST /api/admin/stats` `{ passphrase }` returns `{ onBoard, recruited, entries[] }` (up to 1000, oldest first). 401 on a wrong passphrase.
- `POST /api/admin/wipe` `{ passphrase }`.
- `GET /api/health` used by the deploy smoke test.

## Behavior decisions
- The board is a rolling window, not a capped list. Everyone is accepted; when a 51st joins, the oldest bauble falls off. Recruited count keeps rising.
- A phone whose entry has been bumped off (or wiped) sees the form again and may rejoin. Token is the entry id in localStorage, checked via `/api/me`.
- No per-IP rate limiting (venue wifi shares one IP). Protection is Turnstile, the blocklist and the 20-character cap.
- The blocklist is the `obscenity` defaults. It flags a few real names (for example "Dick", "Analise"). Accepted.
- One bauble never overlaps another: physics bodies keep zero rotation (Matter resets inertia on every scale, so it is re-applied after each `Body.scale`); arrivals and the first load are placed in free space using live body bounds, widest first.
- Poll failure on the board keeps the last state silently.
- Unknown URLs render the board.

## Security
Implemented and verified locally (2026-10-03):
- Server-side allowlist validation of names (see CLAUDE.md "Security"); bound parameters on every D1 query; user text rendered only as React text.
- POSTs must be JSON and same-origin (Origin and Sec-Fetch-Site checks); request bodies capped; generic 500 handler.
- Admin: constant-time passphrase compare, per-IP lockout (10 failures per 10 minutes, `admin_failures` table, migration 0002), a deploy warning when `ADMIN_KEY` is under 12 characters.
- Flood guard on joins (at most 60 per 30 seconds, 429 beyond); Turnstile on `main`.
- `public/_headers`: CSP (self plus Turnstile only), `frame-ancestors 'none'`, nosniff, no-referrer, permissions policy, COOP; `/admin` is `noindex` and disallowed in `robots.txt`.
- Workflows: minimal `permissions`, `cloudflare/wrangler-action` pinned to a commit SHA. `pnpm audit` clean.
- Known limit: the lockout is per IP, so someone on the same venue network hammering `/admin` could lock the owner out for ten minutes (the board itself is unaffected).

**These requirements must be in the act 3 prompt** (the one that builds the Worker, `/join` and `/admin`). Copy the "Security" section of CLAUDE.md into `prompts/act-3.md` and tell Claude to write tests for the validation, including injection and markup payloads.

## Data
D1 table `entries(id, name, emoji, fill, tied_to, created_at)` in `migrations/0001_entries.sql`. Each branch deployment has its own database.

## Deploys (GitHub Actions only)
- `deploy.yml` on push to `main`, `demo*`, `rehearsal*` (and manual dispatch): typecheck + Vitest gate, then names the Worker and D1 database from the branch (`hackerboard` on main, `hackerboard-<slug>` elsewhere), creates the database if missing, rewrites `wrangler.jsonc` in CI via `.github/scripts/point-wrangler.sh`, builds, applies migrations, deploys, sets secrets, smoke-tests `/api/health`.
- `cleanup.yml` deletes a branch's Worker and database when a `demo*` or `rehearsal*` branch is deleted.
- `wipe.yml` (manual dispatch) empties the board of the branch it runs on, using the Cloudflare credentials in GitHub (no admin passphrase needed).
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_KEY`, `TURNSTILE_SECRET`. Variable: `VITE_TURNSTILE_SITE_KEY`.
- Turnstile: every deployed branch uses the real widget when `TURNSTILE_SECRET` and `VITE_TURNSTILE_SITE_KEY` are set (hostname `zaquariah.workers.dev` must be allowed on the widget). `main` runs with no captcha if they are missing; other branches then fall back to Cloudflare's always-pass test keys.
- Local dev: `pnpm dev` (UI only) or `pnpm run cf:dev` (Worker + local D1; copy `.dev.vars.example` to `.dev.vars`).

## Verified on `main`
- Production: empty state; two recruits joining through the real Turnstile widget; Turnstile enforced server-side (403 without a token); deploy and wipe workflows.
- Local browser checks: first load with 50 (0 overlaps from the first frame), incremental fill to 50 and the tier shrink, the 51st-join fall, a burst of 20 simultaneous joins on a full board, reduced motion (no drift, strings drawn), join error states (network, Turnstile 403, rejected name not echoed), the bumped-off phone returning to the form, admin offline error, admin list with OFF markers.
- 22 unit tests: name validation (allowlist, markup and SQL payloads, Unicode edge cases, blocklist), fill and tie picking, elapsed formatting.

## Not verified / open
- Admin with the real passphrase on production (only the owner can).
- Arrival animation and string draw observed live in a foreground tab on production.
- OG preview image (only title and description tags exist).

## Talk plan
Runbook and the copy-paste prompts live in `docs/DEMO.md`; the traps and deviations the prompts rely on are in `docs/hackerboard/IMPLEMENTATION-NOTES.md`.
- `main` is the finished app. The starting point for every run is the `demo-start-2` tag: `main` with the pieces the prompts build removed (placeholder routes, a health-only Worker, no hooks, API client, physics, validation, admin, join components or tests), and everything else kept (workflows, scripts, headers and CSP, tokens, fonts, primitives, Hero, QRCard, static Bauble, dependencies, docs).
- Each run: `git checkout -b demo-<MMDD-HHMM> demo-start-2`, then prompts 0 to 8. Branches named `demo*` or `rehearsal*` deploy on push to `hackerboard-<branch>` with their own database; deleting the branch deletes them.
- Fallback: `git checkout main -- .`, or show `main`.
- Model for the live session: Sonnet 5.5, the same one used in rehearsal. Fallback network: phone hotspot.
