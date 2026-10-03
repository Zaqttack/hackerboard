# Hackerboard

A live board for the RowdyHacks XII talk "Build a website with AI". Attendees scan a QR code, enter a name on `/join`, and appear on `/` as floating baubles. `/admin` wipes the board.

## Source of truth
- Design: `docs/hackerboard/DESIGN.md`. Artboards in `docs/hackerboard/design-source/` are visual reference only; port markup and styles into React, do not copy the template runtime.
- Plan and decisions: `PLAN.md`.
- DESIGN.md shows tokens as a Tailwind v3 `theme.extend` block. This repo uses Tailwind v4, so define them with `@theme` in `src/index.css`.

## Stack
Vite, React 19, TypeScript (strict), Tailwind v4, react-router-dom. One Cloudflare Worker (`src/worker/index.ts`) serves `/api/*` with a D1 database bound as `DB`; static assets come from `dist/`. Physics uses matter.js with zero gravity, rendered through DOM transforms.

## Commands
- `pnpm dev` runs Vite; `/api` proxies to `localhost:8787`.
- `pnpm run cf:dev` builds, applies migrations to the local D1, and runs `wrangler dev` on 8787. Needs `.dev.vars` (copy `.dev.vars.example`) for `/admin`.
- `pnpm run typecheck`, `pnpm test`.
- Always pnpm, never npm or yarn.

## Deploys
Every branch matching `main`, `demo*` or `rehearsal*` is a deployment. `.github/workflows/deploy.yml` names the Worker and D1 database from the branch (`hackerboard` on main, `hackerboard-<branch>` elsewhere) and rewrites `wrangler.jsonc` in CI. Do not hand-edit the placeholder `database_id`. Deploy only through GitHub Actions. Never commit secrets: `ADMIN_KEY` and Cloudflare credentials live in GitHub secrets.

## Demo mode
This repo is used for a live talk (see `docs/DEMO.md`). The finished app is `main`; the demo rebuilds it from the `demo-start` tag by pasting the prompts in `docs/DEMO.md`.
- Never build demo work on `main`. If the user asks to start or continue the demo, or pastes a prompt from `docs/DEMO.md`, and the current branch is not `demo*` or `rehearsal*`, first create a new branch from the tag: `git checkout -b demo-<MMDD-HHMM> demo-start` (use the current date and time), unless the user names a branch. Fetch tags first if `demo-start` is missing.
- A `demo*`/`rehearsal*` branch deploys itself when pushed. Commit and push only when the prompt or the user asks for it.
- If something is badly stuck, the finished version is available with `git checkout main -- .`.
- For normal work on `main` itself (fixes, docs), ignore this section.

## Security (non-negotiable, include in every prompt that touches the API or user input)
- Validate all input on the server with an allowlist, never a denylist. Names: normalize NFC, strip control, format, private-use and unassigned characters, cap runs of combining marks, 1 to 20 code points, then allow only letters, numbers, marks, emoji, spaces and `._'’!?&#@+()*~-`. The client check is a convenience only.
- Every D1 query uses bound parameters (`.bind()`). Never build SQL from input.
- Render user text only as React text nodes. Never `dangerouslySetInnerHTML`, `innerHTML` or URL building from names.
- Every POST requires `content-type: application/json` and a same-origin `Origin`/`Sec-Fetch-Site`. Cap request bodies. Never trust a client-supplied id for anything but lookup.
- Admin: constant-time passphrase compare, per-IP lockout after repeated failures, passphrase only from the `ADMIN_KEY` Worker secret.
- Public writes are throttled (flood guard) and, on `main`, require a Turnstile token verified server-side.
- Security headers and the CSP live in `public/_headers`. Any new external origin (script, frame, connect, font, image) must be added there deliberately.
- Errors return generic JSON; never leak stack traces, SQL or secrets. No secrets in the repo or the client bundle (the Turnstile site key is public by design).
- Pin third-party GitHub Actions that receive credentials to a commit SHA and keep workflow `permissions` at the minimum.

## Conventions
- Names: trim, collapse spaces, 1 to 20 characters, validated on the server as well as the client. Never echo a rejected name back.
- The server assigns emoji, fill and `tied_to`.
- Migrations go in `migrations/` as numbered SQL files.
- No comments unless the why is non-obvious. No third-party artwork; emoji and CSS/SVG only.
