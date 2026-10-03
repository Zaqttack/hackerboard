# Running the demo

Hackerboard is built live in a fresh Claude session by pasting the prompts below, in order. Each prompt builds one slice of the app; the finished version is on `main`.

## Rules for the session
- Never build on `main`. Every run starts on a new branch from the `demo-start` tag, named `demo-<MMDD-HHMM>`.
- Any branch named `demo*` (or `rehearsal*`) deploys by itself on push to its own Worker (`hackerboard-<branch>`) and its own database. Nothing touches `main`'s board.
- Claude commits and pushes only when a prompt says so.
- If a step goes sideways, take the finished app: `git checkout main -- .` then commit, or just show the `main` deployment (https://hackerboard.zaquariah.workers.dev).

## Before the talk
1. Confirm `main` is deployed and its board is empty (run the **Wipe board** workflow on `main`, or use `/admin`).
2. In the Cloudflare Turnstile widget, make sure the hostname `zaquariah.workers.dev` is listed so every demo branch URL is allowed.
3. Confirm the GitHub secrets exist: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_KEY` (a long passphrase), `TURNSTILE_SECRET`, and the variable `VITE_TURNSTILE_SITE_KEY`.
4. Open VS Code on a clean checkout (`git fetch --tags`, `git status` clean) and start a new Claude session. Use the model you rehearsed with.
5. Have the `main` URL ready as the fallback for the QR code.

## After the talk
- Run prompt 9 to delete the demo branch locally and on GitHub; the `cleanup.yml` workflow then deletes its Worker and database. In the Actions list that run is labelled `main`, because GitHub runs delete events on the default branch; it only removes the deleted branch's deployment.
- Wipe `main`'s board if you want it empty (**Wipe board** workflow on `main`).

## The prompts

### 0. Start the session
```
We're doing the live Hackerboard demo. Read CLAUDE.md, docs/DEMO.md, docs/hackerboard/DESIGN.md and docs/hackerboard/IMPLEMENTATION-NOTES.md first.

Don't work on main. Create a new branch from the demo-start tag named demo-<MMDD-HHMM> (use the current date and time), run pnpm install, then run typecheck, test and build and confirm they pass.

Then tell me, in a few bullets: the branch name, what already exists in the repo, and what we still need to build. Don't write any code and don't commit.
```

### 1. The board and join page (local, UI only)
```
Build the board page (/) and the join page (/join) as UI only, with no network calls yet. Follow docs/hackerboard/DESIGN.md sections 2, 3 (the arrival animation only) and 4, and docs/hackerboard/IMPLEMENTATION-NOTES.md. Reuse the existing components in src/components and the tokens in src/index.css.

Board (/):
- Add a Stage component: a fixed 1920×1080 stage scaled to fit the window with transform: scale(min(vw/1920, vh/1080)), centered, with the darker cork showing around it.
- Render Hero, QRCard (the QR encodes window.location.origin + "/join"), and 10 hardcoded sample baubles at fixed positions, sized by the density tier from src/lib/tiers.ts.
- Add the empty state (EmptyGhost) for zero baubles.
- Add the arrival animation for a new bauble: drop, squash, two ring bursts, pin push, the "NEW RECRUIT" stamp and the hero counter tick. CSS keyframes only, using the timings in DESIGN.md.
- Dev only (import.meta.env.DEV): press n to add a fake recruit, c to clear the board, r to reset to the 10 samples.

Join (/join):
- JoinForm, BaublePreview, TurnstileSlot (a static "Verified" placeholder for now) and JoinResult, with every state from DESIGN.md section 4. The name input has maxLength 20.
- The submit button does nothing yet. Keep the typing, empty-name and 20-character states working locally.

Run pnpm dev, check both pages at 1920×1080 and 390×844 against the design, fix what's off, and make sure typecheck and build pass. Don't commit.
```

### 2. Ship the static board
```
Commit everything on this branch with a clear message, push it, and watch the GitHub Action with gh run watch until it finishes. Don't change any code.

Then give me the live URL of this branch's deployment and tell me what the pipeline did (tests, database, deploy).
```

### 3. The API, with security and tests
```
Build the backend in src/worker, with tests. Read the "Security" section of CLAUDE.md first; every rule there is mandatory. Don't change any UI in this step. Copy .dev.vars.example to .dev.vars for local runs.

Endpoints (JSON; every POST must be same-origin application/json):
- GET /api/wall: the 50 newest entries, oldest first, as { id, name, emoji, fill, tiedTo, createdAt }.
- POST /api/sign { name, turnstileToken }: validate the name, apply the flood guard, verify Turnstile (skip the check only when no TURNSTILE_SECRET is set), then insert. The server picks the emoji (src/shared/animals.ts), the fill (never the same as the previous entry's) and tied_to (odds and the 3-string limit from DESIGN.md "Strings"). Return 201 with the entry. Errors: 400 invalid, 422 rejected, 403 turnstile, 429 busy. Never refuse because the board is full; the board is a rolling window of the 50 newest.
- GET /api/me?id=: the entry plus onBoard (false once 50 newer entries exist), or 404.
- POST /api/admin/stats { passphrase } returns { onBoard, recruited, entries } with every entry in join order; POST /api/admin/wipe { passphrase } deletes all entries. Compare the passphrase with env.ADMIN_KEY in constant time. Lock an IP out for ten minutes after ten wrong tries (add migration 0002 with an admin_failures table). 401 for wrong, 429 when locked.

Name validation (src/worker/validate.ts): normalize NFC; strip control, format, private-use and unassigned characters; cap runs of combining marks at two; collapse whitespace; trim; require 1 to 20 code points; then allow only letters, numbers, marks, emoji, spaces and ._'’!?&#@+()*~-; then run the obscenity blocklist (englishDataset). Return 422 "rejected" for disallowed characters or profanity and 400 "invalid" for length.

Other rules: at most 60 joins per 30 seconds; request bodies capped at 2 KB; a catch-all that returns a generic 500; every response sets cache-control: no-store and x-content-type-options: nosniff. Confirm public/_headers still allows challenges.cloudflare.com for script, frame and connect.

Write Vitest tests for the validation, including markup, template, SQL and Unicode payloads, and for the emoji, fill and tie picking. Then run pnpm run cf:dev and exercise every endpoint with curl, including the attack payloads and the lockout. Report what passed. Don't commit.
```

### 4. Connect the board and the join page to the API
```
Connect the UI to the API. Don't touch the Worker. Follow docs/hackerboard/DESIGN.md sections 2, 4 and 7 and docs/hackerboard/IMPLEMENTATION-NOTES.md.

Board:
- Replace the hardcoded baubles and the dev keys with a useWall hook that polls GET /api/wall every 4 seconds and diffs by id. On first load show everyone with no animation. New ids play the arrival, staggered 350 ms apart. Ids that disappear fade out (the fall comes later, in the physics step). Keep the last known board when a poll fails, and show the empty state when there are no entries.
- Place baubles without overlap using measured sizes: widest names first on first load, new arrivals in free space.

Join:
- Replace the Turnstile placeholder with the real widget (explicit render of https://challenges.cloudflare.com/turnstile/v0/api.js using the site key from import.meta.env.VITE_TURNSTILE_SITE_KEY); with no site key, treat the user as verified.
- Submit with POST /api/sign: 201 shows the success screen with the assigned animal; 422 shows the rejected message (never echo the name back); 400 shows the empty/invalid message; 403 shows "couldn't verify, try again" and resets the widget; a network failure or 429 shows the NO SIGNAL banner and keeps the typed name.
- Remember the entry id in localStorage. On load call GET /api/me: if the entry is on the board show the "already on the board" screen; if it's missing or bumped off, clear the stored id and show the form.

Run pnpm run cf:dev, join from /join and watch the board update. Typecheck and build must pass. Don't commit.
```

### 5. The admin page
```
Build the /admin page from DESIGN.md section 5 (locked, wrong passphrase, ready, confirm, wiped). Unlock with POST /api/admin/stats and wipe with POST /api/admin/wipe; keep the passphrase in memory only, never in storage.

When unlocked show ON BOARD and RECRUITED, then a scrollable list of everyone in join order: rank, emoji, name and time since the first join as +m:ss. Dim anyone who has been bumped off the board (index < recruited − onBoard) and tag them OFF. Show clear messages for a network failure and for a locked-out IP (429). Typecheck and build must pass. Don't commit.
```

### 6. Ship it and let the audience join
```
Commit everything on this branch with a clear message, push it, and watch the GitHub Action with gh run watch until it finishes. Don't change any code.

Then give me the live URL of this branch's deployment. I'll put the board on the projector for everyone to scan.
```

### 7. Make the board alive
```
Make the board alive. Implement DESIGN.md section 2 (Strings, Density tiers, Full board) and section 3 (Drift and collisions, Ding, Reduced motion, Performance rules) with matter.js, zero gravity, rendering only through DOM transforms. Read docs/hackerboard/IMPLEMENTATION-NOTES.md first; it lists the traps.

Requirements:
- One requestAnimationFrame loop in a usePhysics hook. Each bauble is a rounded-rectangle body (chamfer radius just under half the height), restitution 0.85, no friction, and it must never rotate: call Body.setInertia(body, Infinity) after creating the body AND after every Body.scale.
- Spawn at 10 to 22 px/s in a random heading, keep every bauble between 10 and 28 px/s, and jitter the heading by up to ±10° on each bounce. The visible tilt is a ±3° sine wobble on top of each bauble's base rotation.
- Walls: the stage edges inset 24 px, plus Hero and QRCard (mark them with data-wall, padded 24 px).
- Strings: one SVG layer under the baubles; red 5 px round-capped lines pin to pin with a soft shadow; a weak spring that pulls only past 420 px; a draw animation when a tied bauble arrives. A string to a bauble that left the board is simply not drawn.
- Density tiers from src/lib/tiers.ts: when the count crosses a tier the newcomer lands first, then 400 ms later every bauble springs to the new scale over 700 ms, staggered 12 ms outward from the newcomer; stepping back up waits 2 seconds. Name text never goes below 26 px.
- Dings on impacts above 14 px/s (at most 4 at once, 1.5 s cooldown per pair).
- When the 51st joins, the oldest bauble's pin pops, it tilts 18° and falls off the bottom, its strings retract, and then the newcomer arrives (arrivals wait 1 second after a fall). Extend useWall so each leaving entry carries a mode: "fade" when the whole board was wiped, "fall" otherwise.
- prefers-reduced-motion: no drift, collisions or wobble, seeded scatter, and the simpler arrival from the design.
- Place new arrivals in free space using live body bounds, and re-measure on document.fonts.ready.

Verify with pnpm run cf:dev: add 20 entries, then 50, then a 51st, and confirm no baubles overlap. Typecheck and build must pass. Don't commit.
```

### 8. Final ship
```
Commit everything on this branch with a clear message, push it, and watch the GitHub Action until it finishes. Then give me the live URL, and run git diff main --stat to tell me how far this branch is from main.
```

### 9. Tear down
```
Tear down this demo. First list the remote branches and tell me which demo*/rehearsal* branch you plan to delete (the one we've been working on). Wait for my OK before deleting anything. Never touch main or any tag. Then follow the teardown steps in CLAUDE.md, watch the cleanup run, confirm the branch URL returns 404, and report what was deleted and what failed.
```

## If you only have a few minutes
Run prompts 0, 1 and 2 (UI and a deploy), then switch the audience to `main`.
