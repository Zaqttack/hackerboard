# RowdyHacks XII — Build a Website with AI (demo plan)

Name: hackerboard

## Idea
A hacker board for RowdyHacks XII, built live with Claude. The root page is projected on a desktop display: a hero with a QR code and instructions, and every attendee who joins appears as a floating bauble (emoji + name) placed around the screen.

## Pages
- `/` — projected board: hero, QR code (top corner) + short instructions, floating baubles. Polls `GET /api/wall` every ~4s.
- `/join` — phone form: name only (max 20 chars). On success shows "you're in" + assigned emoji. localStorage flag prevents repeat signing.
- `/admin` — one button to wipe all entries. Gated by a passphrase checked server-side (`ADMIN_KEY` Worker secret).

## Stack
- Vite + React + TypeScript + Tailwind, pnpm
- Cloudflare (Workers static assets or Pages — confirm at setup) + one Worker/Function
- D1 (SQLite) for entries. Not KV: KV reads can be stale ~60s at other edges.
- Turnstile added as the final prompt of the talk (on in `main`)

## API
- `GET /api/wall` — `Entry[]` = `{ id, name, emoji, fill, tiedTo, createdAt }`, 50 newest, oldest first
- `POST /api/sign` — `{ name, turnstileToken? }`; server trims, collapses spaces, 1–20 chars, blocklist-filters, picks emoji + fill (fill never repeats the previous entry's) + `tied_to` (see DESIGN.md "Strings"), inserts, returns the entry
- `POST /api/admin/stats` — passphrase must match `ADMIN_KEY`; returns `{ onBoard, recruited }` (the unlock step; wrong passphrase = 401)
- `POST /api/admin/wipe` — passphrase must match `ADMIN_KEY`; deletes all rows

No per-IP rate limiting (venue wifi shares one IP). Use Turnstile + client-side "already signed" flag.

## Data
One D1 table `entries(id, name, emoji, fill, tied_to NULL, created_at)`. Lives in the Cloudflare account, not the repo. Each branch deploy has its own database (see Per-branch deploys). Terminal wipe: `pnpm dlx wrangler d1 execute <db-name> --remote --command "DELETE FROM entries"`.

## Assets
Emoji only. ~30 curated animals. No third-party art in the repo. The RowdyHacks PNGs in the project root are not used and are gitignored.

## Design
Done. Source of truth is `docs/hackerboard/DESIGN.md` (tokens, board, motion, join, admin, components, build order) with artboards in `docs/hackerboard/design-source/`. `docs/` ships in `demo-start` and `CLAUDE.md` points at it, so Claude reads the spec live. Open in the spec: matter.js vs hand-rolled physics.
Original brief, kept for reference: `DESIGN-PROMPT.md`.

Prompt for Claude Design is in `DESIGN-PROMPT.md` (palette and RowdyHacks screenshots as inspiration; attach the screenshots when running it). Direction: detective cork board / heist case file (cork, paper, red string, tape, stamps), original CSS/SVG only, no RowdyHacks art. Flashy floating baubles (physics: soft collisions, e.g. matter.js with zero gravity; decided after seeing the design), desktop display.

## Setup checklist
Deploys go through GitHub Actions only (same pattern as srcprint: Workers + `cloudflare/wrangler-action`, pnpm). The CLI is only for local `wrangler dev` (local D1 simulation, no login needed).
- [ ] GitHub repo (public, personal account)
- [ ] Cloudflare account (free)
- [ ] API token (Workers Scripts edit + D1 edit) and account ID
- [ ] GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_KEY`, later `TURNSTILE_SECRET` (pushed to the Worker by wrangler-action's `secrets` input)
- [ ] GitHub repo variable: `VITE_TURNSTILE_SITE_KEY` (public)
- [ ] Workflow `deploy.yml` (see Per-branch deploys): create D1 if missing -> typecheck + build -> `d1 migrations apply --remote` -> deploy; `workflow_dispatch` for manual reruns
- [ ] Pipeline stays lean (no e2e; slow pipelines drag on stage). Open: lint + unit as a parallel non-gating job, or gating only if under ~1 min
- [ ] README "Deploy your own": fork, create token + note account ID, add the 3 secrets, push to `main` or run the workflow
- [ ] Rehearse on a `rehearsal-N` branch, then wipe

## Branches / tags
- `main` — finished, shareable. Deploys Worker `hackerboard`.
- `demo` — the live build, branched from tag `demo-start`. Deploys `hackerboard-demo`.
- `rehearsal*` — dry runs, branched from `demo-start` (e.g. `rehearsal-1`). Deploys `hackerboard-rehearsal-1`.
- Tags: `demo-start` (scaffold only: Vite, Tailwind, design tokens, CLAUDE.md, workflow, README) and `act-1`..`act-4` (recovery checkpoints)
- Never force push: for a fresh run, branch from the tag under a new name.

## Per-branch deploys
`deploy.yml` derives everything from the branch name: slug -> Worker name (`hackerboard` on main, else `hackerboard-<slug>`) and D1 database name (same). The workflow creates the D1 database if missing and injects its `database_id` into the config before `wrangler deploy --name`. No per-branch config files, and forks need no manual `d1 create`. Only `main`, `demo*`, and `rehearsal*` deploy. Each branch has its own database, so rehearsal data never touches `main`.
Verified 2026-10-02: create-if-missing D1 in CI (`wrangler d1 list --json` + `jq`) works with the token's scopes. `main` -> `hackerboard.zaquariah.workers.dev`, `rehearsal-0` -> `hackerboard-rehearsal-0.zaquariah.workers.dev`, each smoke-tested via `/api/health`.

## Demo arc (~25 min, prepared prompts + a few custom)
See "Live boundary" for the acts, in order: board UI (local), deploy static, API + join + admin + protections (audience joins), physics and motion.

Fallback: phone hotspot.

## Live boundary
- In `demo-start` (pre-seeded): scaffold, `deploy.yml`, secrets, README, `CLAUDE.md`, `docs/`, Tailwind tokens + fonts, cork background CSS, primitives (Stamp, pushpin, tape, torn paper), Hero, QRCard (`qrcode.react`), static Bauble. Deploy `demo-start` once before the talk so the `hackerboard-demo` Worker and D1 exist (then wipe).
- Built live, in this order (nothing public-writable ships without its protections):
  1. Board from the seeded pieces (hardcoded baubles + arrival CSS animation), local only.
  2. Push: deploy the static board. No API yet, so nothing to attack.
  3. Worker + D1 + `/join` + `/admin` + board polling, shipped together with validation, the blocklist, Vitest tests (gating, seconds), the `ADMIN_KEY` passphrase, and Turnstile. One deploy, then the audience joins.
  4. matter.js drift + strings + the rest of DESIGN.md section 3 (tiers, dings, 51st-join exit, reduced motion). Pure client, zero risk, safe to cut or shorten if time runs out. The audience is already on the board, so the board comes alive while they watch.
- Goal: after all acts, `demo` is functionally identical to `main`. `main` is the same build done ahead of time (and the fallback if an act goes sideways). Nothing is `main`-only.
- Physics: matter.js, zero gravity, rendered via DOM transforms.
- Fonts: bundled with `@fontsource` packages (Caveat Brush, Kalam, Special Elite, Zilla Slab).
- Act 1 is local only (`pnpm dev`): static board, hardcoded baubles, arrival animation replayable (e.g. a dev-only trigger), `/join` form UI with no backend yet. Nothing works for real until act 3.
- Each act = one prepared prompt plus optional follow-ups. `/clear` between acts to keep context lean.
- `prompts/act-N.md` live in `main` only; they double as a takeaway.

## Gaps beyond DESIGN.md (defaults, confirm)
- "Already on the board" must be validated server-side. The token is the server-generated entry id in localStorage; `GET /api/me?id=` checks it against D1 and the client clears the token if the row is gone (e.g. after a wipe).
- QR card: drop the URL text line from the spec. QR + "Scan to join" only. The QR encodes `window.location.origin + '/join'` at runtime, so the URL never needs to be known before deploy and no custom domain is needed.
- Bauble colliders use measured DOM width (ResizeObserver), not the 220–470 estimate. Wide glyphs (CJK, emoji in names) and zero-width/control characters: normalize and strip on the server.
- Blocklist: use an npm package (e.g. `obscenity`) rather than a word list in a public repo; covered by Vitest.
- Board poll failure: keep the last known state silently, retry next tick. No UI.
- Not designed, small: Turnstile failed/expired state on `/join`; admin wipe network error; 404 route (SPA fallback to `/`); favicon, `<title>`, OG image (main is shareable); input attrs (`autocomplete=off`, `autocapitalize=words`, `enterkeyhint=done`); MIT LICENSE.
- Turnstile on `demo`/rehearsal deploys only enforces if the real widget's hostname allowlist accepts the workers.dev hostname; otherwise they run Cloudflare's test keys (always pass). Check the widget settings before the talk.

## Other decisions
- QR code generated client-side from `window.location` with `qrcode.react` (SVG). The audience scans whichever deploy is on screen (`demo`; `main` is the fallback).
- Both `main` and `demo` are deployed. `main` is deployed ahead of time; `demo` deploys live.
- Tests: a few Vitest unit tests for name validation + blocklist, run as a parallel non-gating CI job.
- After the talk: leave `main` open for signing (Turnstile + blocklist); wipe via `/admin` when wanted.
- Model for the live session: Sonnet 5.5, same model in every rehearsal.
