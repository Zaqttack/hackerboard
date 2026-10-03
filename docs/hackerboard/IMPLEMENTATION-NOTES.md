# Implementation notes

Where the finished app differs from `DESIGN.md`, and the traps that cost time. Read this together with `DESIGN.md` before building anything.

## Differences from DESIGN.md
- Tailwind is v4. DESIGN.md shows a v3 `theme.extend` block; define the tokens with `@theme` in `src/index.css` (already done).
- QR card: no URL line under "Scan to join". The QR encodes `window.location.origin + "/join"` at runtime.
- Fonts are bundled with `@fontsource` packages, not loaded from Google Fonts.
- The board is a rolling window, never a capped list. Everyone is accepted; the 51st join pushes the oldest bauble off (a fall, not a fade, unless the whole board was wiped, which fades).
- The join page has no "board full" state. A phone whose entry was bumped off (or wiped) clears its stored id and shows the form again.
- `/admin` also lists everyone in join order with `+m:ss` since the first join and an `OFF` tag on anyone bumped off. This is not in DESIGN.md.
- Hero recruit counter reads `FULL HOUSE 50 / 50` at the cap and ticks (scale 1.25 to 1) when it grows.

## Data and API behavior
- `entries.created_at` is epoch milliseconds. "50 newest" is `ORDER BY created_at DESC LIMIT 50`, returned oldest first.
- `GET /api/me?id=` reports `onBoard` as "fewer than 50 entries are newer".
- `tied_to` is chosen on the server from the 50 newest entries that have fewer than 3 strings; odds are 80% for recruits 2 to 10, 40% for 11 to 25, 20% for 26 to 50. Never tie the first recruit.
- Fill is random from the six fills and never equals the previous entry's fill.
- Turnstile: the client renders the widget explicitly. With no `VITE_TURNSTILE_SITE_KEY` the user counts as verified and the server skips verification when there is no `TURNSTILE_SECRET`. Non-`main` branches are deployed with Cloudflare's always-pass test keys.

## Board and animation
- The stage is a fixed 1920 by 1080 box scaled with `transform: scale(min(vw/1920, vh/1080))`. Physics coordinates are stage coordinates, so they do not change with the window.
- Baubles are `position: absolute; left: 0; top: 0`. The physics hook owns each bauble's `transform` (translate3d, rotate, scale). React must not set `transform` on them.
- The arrival animation uses the independent CSS properties `translate`, `scale` and `opacity` (not `transform`) so it composes with the physics transform.
- Wall rectangles for Hero and QRCard come from `[data-wall]` elements via `offsetLeft`, `offsetTop`, `offsetWidth` and `offsetHeight` (layout values, unaffected by the stage scale).
- First load shows everyone without animation. New ids after the first load animate in, staggered 350 ms; if baubles fell in the same poll, arrivals wait 1 second.
- If a poll fails, keep the last known board.

## matter.js traps (all of these were hit)
- `Body.scale` resets inertia. Call `Body.setInertia(body, Infinity)` after creating the body and after every `Body.scale`, or bodies spin on impact while the DOM stays level, which looks like baubles overlapping.
- Passing `inertia: Infinity` to `Bodies.rectangle` is ignored.
- Velocities are pixels per step (1/60 s), not per second. Convert px/s by dividing by 60.
- Use `chamfer: { radius: height / 2 - 1 }` for the pill shape.
- The string is a weak spring applied as small velocity nudges past 420 px, not a Matter `Constraint` (a constraint also pushes when the pins are closer than its length).
- Keep Matter's speed in the 10 to 28 px/s band by re-setting velocity each step when it leaves the band; apply the heading jitter after `Engine.update`, for bodies flagged in `collisionStart`.
- Step with a fixed 1/60 s timestep (accumulator, at most 3 steps per frame).
- Measure bauble widths from the DOM (`offsetWidth`) and re-measure on `document.fonts.ready`; the estimate of 220 to 470 px is wrong for wide glyphs.
- Place new arrivals in free space using live body bounds. Random placement from stale positions spawns baubles on top of ones that have drifted. On first load place the widest names first.
- Scale floor: name text never below 26 px, so the scale never goes under about 0.77.
- Reduced motion: skip stepping and wobble, draw strings with a fade, scale changes in a single 200 ms ease-out.

## Security
See the "Security" section of `CLAUDE.md`. The CSP in `public/_headers` allows only `'self'` and `https://challenges.cloudflare.com`. If you add an external origin, add it there.

## Local development
- `pnpm dev` runs the UI only. `pnpm run cf:dev` builds, applies migrations to the local D1 and serves the Worker on 8787; it needs `.dev.vars` (copy `.dev.vars.example`).
- To exercise the whole app locally, seed entries with `curl -X POST localhost:8787/api/sign -H 'content-type: application/json' -d '{"name":"Maya"}'`.
