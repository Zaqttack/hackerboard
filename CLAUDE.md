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

## Conventions
- Names: trim, collapse spaces, 1 to 20 characters, validated on the server as well as the client. Never echo a rejected name back.
- The server assigns emoji, fill and `tied_to`.
- Migrations go in `migrations/` as numbered SQL files.
- No comments unless the why is non-obvious. No third-party artwork; emoji and CSS/SVG only.
