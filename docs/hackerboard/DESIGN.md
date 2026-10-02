# Hackerboard design spec

Source of truth for building Hackerboard (RowdyHacks XII talk). React + Vite + Tailwind. No raster assets: cork, paper, tape, pins and stamps are all CSS.

Three routes:

- `/` the board (1920×1080 projected stage)
- `/join` mobile join form (designed at 390×844)
- `/admin` passphrase + wipe

The `design-source/` folder next to this file has the canvas artboards as HTML. Treat them as visual reference for exact markup and inline styles. They use a template runtime (`{{holes}}`, `<sc-for>`, `<sc-if>`), so don't copy the runtime; port the markup and styles into React components.

---

## 1. Tokens

### Tailwind `theme.extend`

```js
colors: {
  cork:   { DEFAULT: '#B8864B', edge: '#9A6B36' },
  paper:  { DEFAULT: '#F3F0E7', shade: '#E2DCCD' },
  ink:    { DEFAULT: '#1A1A1A', soft: '#4A4540' },
  string: { DEFAULT: '#B3261E', dark: '#8F1D17', tint: '#FBEDEA' },
  tape: '#E8C85A',
  success: '#2F6B3A',
  pin: { hi: '#E25A50', mid: '#B3261E', lo: '#6E1510' },
  bauble: { paper: '#F3F0E7', tape: '#E8C85A', manila: '#DCC395', carbon: '#BCD2E8', memo: '#F1B9B1', mint: '#C4E0C0' },
},
fontFamily: {
  display: ['"Caveat Brush"', 'cursive'],
  hand: ['Kalam', 'cursive'],
  stamp: ['"Special Elite"', 'monospace'],
  body: ['"Zilla Slab"', 'serif'],
},
borderRadius: { sm: '4px', md: '8px', lg: '10px', xl: '12px' },
boxShadow: {
  paper: '0 12px 18px rgba(40,20,0,.40)',
  bauble: '0 6px 0 rgba(26,26,26,.2), 0 14px 22px rgba(40,20,0,.38)',
  press: '0 5px 0 #1A1A1A',
  string: '0 3px 3px rgba(0,0,0,.28)',
},
transitionTimingFunction: {
  fall: 'cubic-bezier(.55,0,1,.45)',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
  out: 'cubic-bezier(.16,1,.3,1)',
  inout: 'cubic-bezier(.65,0,.35,1)',
},
```

Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Kalam:wght@700&family=Special+Elite&family=Zilla+Slab:wght@500;700&display=swap" rel="stylesheet">
```

### Font roles

| Font | Use | Sizes |
|---|---|---|
| Caveat Brush | Display only (titles) | board 128, admin 72, phone 60 / 50 |
| Kalam 700 | Names, prompts, buttons, inputs | board name 34 (before tier scale), prompt 38; phone input/button 26, h1 30 |
| Special Elite | Stamps, tape labels, URL, counters | board 20 to 28, phone 14 to 18 |
| Zilla Slab 500/700 | Body, labels, errors (phone + admin only) | 15 to 20 |

Never use handwriting for more than one line.

### Contrast (all AA or better)

ink on paper 15.3 · ink on any bauble fill ≥ 10.2 · paper on string red 5.7 · string red on paper 5.7 · ink-soft on paper 8.3 · success on paper 5.6

### Spacing / strokes

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. Board gutter 64.
- Strokes: bauble 3px ink · input 2px ink · error 3px string · stamp 3 to 4px string · string line 5px · focus ring 4px tape, 2px offset.

### Cork texture (CSS on root)

```css
background-color: #B8864B;
background-image:
  radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(80,45,10,.38) 100%),
  radial-gradient(rgba(70,40,10,.38) 1.2px, transparent 1.7px),
  radial-gradient(rgba(255,230,190,.28) 1px, transparent 1.5px),
  radial-gradient(rgba(90,55,20,.28) 2px, transparent 2.7px);
background-size: 100% 100%, 13px 11px, 17px 19px, 41px 37px;
background-position: 0 0, 0 0, 6px 9px, 20px 4px;
```

Pushpin: `radial-gradient(circle at 35% 30%, #E25A50, #B3261E 55%, #6E1510)` with `box-shadow: 0 3px 4px rgba(0,0,0,.45)`.

Tape strip: `background: rgba(232,200,90,.94)` with
`clip-path: polygon(2% 0,98% 4%,100% 30%,97% 55%,100% 80%,97% 100%,3% 96%,0 70%,3% 45%,0 18%)`.

Torn paper bottom edge (hero card):
`clip-path: polygon(0 0,100% 0,100% 92%,97% 96%,94% 91%,90% 97%,86% 93%,82% 98%,77% 92%,73% 97%,68% 93%,63% 99%,58% 94%,53% 98%,48% 92%,43% 97%,38% 93%,33% 98%,28% 92%,23% 97%,18% 94%,13% 99%,8% 93%,4% 97%,0 94%)`.
Put the drop shadow on a wrapper with `filter: drop-shadow(...)`, since clip-path cuts box-shadow.

---

## 2. Board (`/`)

### Stage

- One fixed 1920×1080 stage, `transform: scale(min(vw/1920, vh/1080))`, centered.
- Outside the stage: same cork texture on `body`, darker (cork-edge base), vignette strongest at the stage edge. Ultrawide gets side bands of cork, never a stretched layout.
- Stage edges are physics walls.

### Layers (back to front)

| z | Layer |
|---|---|
| 0 | Cork background |
| 10 | StringLayer: one full-stage SVG of `<line>`s |
| 20 | Baubles: absolute, transform only |
| 30 | Hero + QRCard: fixed, also physics walls |
| 40 | Stamps, ding ticks: transient |

### Hero

- Position: left 64, top 64, width 660, rotate -1.5deg.
- Paper card with a torn bottom edge, padding 44 52 60.
- Tape label "RowdyHacks XII" overlapping the top-left corner (Special Elite 28, rotate -4deg).
- "Hackerboard" in Caveat Brush 128, line-height .9.
- "Scan to join the crew →" in Kalam 38, string red.
- Stamp row: `RECRUITS {n} / 50` (Special Elite 26, 4px string border, rotate -3deg) plus "CASE NO. XII" in Special Elite 20. At 50 the stamp reads `FULL HOUSE 50 / 50`.

### QRCard

- Position: right 64, top 52, width 340, rotate 2deg, pushpin top-center.
- Paper with a 260×260 white tile. The QR code is 220×220 inside the tile, which leaves a 20px quiet zone.
- Under the tile: "Scan to join" in Kalam 34, then the URL in Special Elite 24, string red.

### Physics walls

Hero rect and QR rect, padded 24px, plus the stage edges inset 24px.

### Bauble

| Part | Spec |
|---|---|
| Body | Pill, height 88, padding `0 30px 0 7px`, gap 14, radius 44, 3px ink border, shadow-bauble |
| Fill | Random of 6 bauble fills; no repeat of the previous fill |
| Coin | 68px white circle, 3px ink border, emoji 42px |
| Pin | 22px, left 30, top -12. This is the string anchor. |
| Name | Kalam 700 34px, `white-space: nowrap`, `padding-top: 6px` (Kalam sits high) |
| Transform | `rotate(±4deg) scale(tier × variation)`, `transform-origin: 44px 44px` |
| Width | ~220 (4 chars) to ~470 (20 chars) at scale 1 |

### Density tiers

The bauble scale depends on how many people are on the board.

| Recruits | Tier scale |
|---|---|
| 1–15 | 1.20 |
| 16–30 | 1.00 |
| 31–40 | 0.88 |
| 41–50 | 0.78 |

- Per-bauble variation is ±5% around the tier scale. Name text never drops under 26px.
- Crossing a tier on the way up:
  1. The newcomer lands first.
  2. 400ms later, every bauble springs to the new scale over 700ms (ease-spring).
  3. The springs are staggered 12ms each, rippling outward from the newcomer.
- Dropping back below a tier: step back up after a 2s delay, so the board doesn't pump.

### Empty state (count 0)

- A dashed-outline ghost bauble: "?" coin, "your name here", at roughly (820, 600), rotate -2deg.
- A red string from the ghost's pin to the QR pin.
- A paper note: "Be the first recruit." (Caveat Brush 52, string red) above "Scan the code up top ↗" (Kalam 26).
- Ghost breathes: scale 1 to 1.03, 2.4s alternate.

### Strings (connections)

- **Tie odds per arrival:** recruits 2–10 tie 80% of the time, 11–25 at 40%, 26–50 at 20%. That's about 18 strings at a full board.
- **Target:** chosen server-side in `POST /api/sign`: a random entry among the 50 newest that has fewer than 3 strings. One string max per arrival. (Positions live on the client, so the server can't pick "nearest". The string spring pulls tied baubles together anyway.)
- **Persistent:** stored as a nullable `tied_to` column on the new entry's row. Never re-roll on refresh, poll or a new join.
- **Removal:** when an entry falls out of the 50 newest, any string pointing at it is simply not drawn. No re-tie.
- **Physics:** the line is pin-to-pin, redrawn every frame. It's slack until 420px, then acts as a weak spring (0.4 px/s² per 100px over).
- **Look:** 5px stroke, `#B3261E`, round caps, plus a 25% black copy offset (2, 4) as the shadow.

### Full board (51st joins)

- The oldest bauble's pin pops (120ms), the bauble tilts 18deg and falls off the bottom (900ms ease-in).
- Its strings retract over 250ms.
- Then the newcomer arrives as normal.

---

## 3. Motion

### Arrival (tied, ~2.8s)

| Step | Time | Spec |
|---|---|---|
| Drop | 0–260ms | translateY -160 to 0, opacity 0 to 1, ease-fall |
| Squash + recover | 260–480ms | scale (1.18, 0.82) to (1, 1), ease-spring, origin bottom |
| Pin push | 300–460ms | pin scale 1.6 to 1, ease-spring |
| Ring burst ×2 | 300–950ms | dashed 4px string ring at inset -18 + solid 3px 45% ring at inset -40; scale .7 to 1.5, opacity 1 to 0, ease-out; 2nd ring +120ms |
| String draw | 350–850ms | from the target's pin to the new pin, stroke-dashoffset length to 0, ease-inout |
| Tug | 850–1100ms | target velocity += 40px/s toward the newcomer |
| Stamp | 850–2800ms | "NEW RECRUIT", Special Elite 22, 3px string border, paper bg, rotate -6deg; scale 2 to 1 over 180ms, hold 1.4s, fade 400ms |
| Counter tick | 850–1050ms | hero stamp scale 1.25 to 1, spring |

An untied arrival skips the string draw and the tug.

### Drift and collisions

- Speed 10 to 22 px/s, random heading, max 28 px/s.
- Rotation wobble ±3deg on a 7 to 11s sine, random phase.
- Colliders: rounded rects at the scaled size. Restitution 0.85, heading jitter ±10deg on each bounce.
- Ding: on impacts above 14px/s, draw three short ink ticks at the contact point (scale .6 to 1.2 and fade, 280ms). Max 4 at once, 1.5s cooldown per pair.

### prefers-reduced-motion

- No drift, collisions or wobble. Use seeded scatter positions that avoid the walls.
- Arrival: fade plus scale .96 to 1, 200ms. Strings fade in over 200ms. The stamp shows static for 1.5s.
- Tier changes: one 200ms ease-out, no stagger.

### Performance rules

- One requestAnimationFrame loop. Write only `transform` per bauble (translate3d + rotate + scale).
- Never animate box-shadow, filter or clip-path. Ring bursts animate border + transform + opacity only.
- 50 baubles means 1,225 pair checks per frame, which a hand-rolled loop handles fine.
- **Physics choice (open):**
  - **matter.js**, zero gravity: rounded-rect bodies (chamfer = half height), walls as static bodies, strings as `Constraint`s with stiffness ~0.002 and `length` 420. Less code to prompt live.
  - **Hand-rolled loop:** lighter, but more to generate on stage.
  - Either way, render through DOM transforms, not matter's canvas renderer.
- Fallback if it stutters: drop the second shadow layer and turn off wobble.

---

## 4. Join (`/join`)

### Layout

- Card max-width 440, centered. Cork background, page padding 28 16 24.
- **Header:** tape label "RowdyHacks XII" (Special Elite 17), then "Hackerboard" (Caveat Brush 60, ink on cork).
- **Card:** paper, padding 26 20 24, gap 16, shadow-paper, pushpin top-center.
- **Card contents:**
  - "Join the crew" (Kalam 30) and "Your name goes up on the big screen." (Zilla 18, ink-soft).
  - Label "Name on the board" (Zilla 700 18), with counter `{n} / 20` (Special Elite 16) on the right.
  - Input: height 60, radius 10, 2px ink border, white fill, Kalam 700 26, placeholder "e.g. Grace H", **`maxLength={20}` hard cap**. The server enforces the same rule: trim, collapse spaces, 1 to 20 characters.
  - Preview bauble (66px tall): "?" coin until an animal is assigned, name or "your name". "Your animal is a surprise." (Zilla 15).
  - Turnstile slot 300×65.
  - Button: height 62, radius 12, 3px ink border, Kalam 700 26.
    - Enabled: string red fill, paper text, shadow-press.
    - Disabled: paper-shade fill, ink-soft text.

### States

| State | Details |
|---|---|
| idle | Empty input, button disabled, Turnstile "Verifying you're human…" |
| typing | 4px tape focus ring, live preview, Turnstile "Verified" (success green check) |
| empty submit | 3px string border, role=alert: "We need a name to pin. Anything up to 20 characters." |
| at limit | Counter turns string red at 20 / 20, neutral hint: "20 characters max. That's the whole bauble." |
| submitting | Input disabled, button "Pinning you up…" with spinner |
| rejected | 3px string border, alert: "That name didn't get past the bouncer. Try a different one." Never echo the name back. |
| network | Tape-yellow banner, 2px ink border, "NO SIGNAL" + "Couldn't reach the board. Your name is still here, so just try again." Button reads "Try again". |
| success | Stamp "RECRUITED"; 150px emoji coin with ring burst; "You're on the board!" (Caveat Brush 50); "Look up. You're the {animal} with the red pin."; their bauble; "Animals are random. No swaps, no take-backs." |
| already | Stamp "ON FILE"; same layout without rings; "Already on the board"; "One recruit per phone. Find yourself up on the big screen." |

### Rules

- The server assigns the emoji and fill, so the phone reveal always matches the board.
- One join per device (cookie or localStorage token). The "already" state shows the stored name and emoji.
- The name filter runs server-side.

---

## 5. Admin (`/admin`)

### Layout

- 560px paper card, centered on cork, padding 52 48 44.
- Tape label "ADMIN · CASE XII".
- "Board control" in Caveat Brush 72.

### States

| State | Details |
|---|---|
| locked | Password input (height 56); ink "Unlock" button |
| wrong | 3px string border; "Wrong passphrase. The board stays as it is."; stamp "DENIED" |
| ready | Stat boxes ON BOARD `50 / 50` and RECRUITED `63`; explainer; red "Wipe the board" button (height 64, shadow-press); stamp "UNLOCKED" |
| confirm | Danger-tint panel, 3px string border, role=alertdialog. "Wipe all 50 baubles?" (Kalam 30, string-dark), then "Everyone comes off the board and the strings go with them. This can't be undone." Buttons: "Keep it" (paper) and "Yes, wipe it" (red). |
| wiped | Stamp "CASE CLOSED"; "The board is clean. 0 / 50 on board, ready for the next crowd."; "Back to control" |

---

## 6. Emoji pool (30)

🦊 🐙 🐸 🦉 🐢 🦝 🐝 🐧 🦄 🐻 🦈 🐞 🦒 🐊 🦋 🐳 🦔 🐼 🐨 🐯 🦁 🐮 🐷 🐵 🦀 🦜 🦩 🦥 🦦 🐌

All are Unicode 12 or older, single code point, with no variation selectors.

---

## 7. Components

| Component | Props |
|---|---|
| `Board` | Owns entries, polls `/api/wall`, diffs for arrivals/exits |
| `Hero` | count |
| `QRCard` | url |
| `Bauble` | name, emoji, fill, scale, rotation, isNew; forwardRef for physics |
| `StringLayer` | links, anchor positions |
| `EmptyGhost` | none |
| `usePhysics` | refs, links, walls, tierScale |
| `Stamp` | text, rotate |
| `JoinForm` | status |
| `BaublePreview` | name, emoji? |
| `TurnstileSlot` | onVerify |
| `JoinResult` | kind: success / already |
| `AdminPanel` | status |

### Data shapes (fits PLAN.md: D1 + polling)

D1 `entries(id, name, emoji, fill, tied_to NULL, created_at)`. `fill` and `tied_to` are the two columns the design adds to PLAN.md's table.

```ts
type Fill = 'paper'|'tape'|'manila'|'carbon'|'memo'|'mint';
type Entry = { id: string; name: string; emoji: string; fill: Fill; tiedTo: string | null; createdAt: number };
// GET /api/wall -> Entry[] (50 newest, oldest first)
```

- **Arrivals:** the board polls `/api/wall` every ~4s and diffs ids. New ids play the arrival animation, staggered 350ms apart when a poll brings several. Ids that disappeared play the exit animation.
- **First load:** existing entries appear without the arrival animation.
- **After a wipe:** the poll returns `[]`, all baubles fade out over 400ms, and the empty state returns.

---

## 8. Build order

1. Tokens + fonts.
2. Static board: cork, Hero, QRCard, 10 hardcoded baubles.
3. Join form + success, wired to the board.
4. Arrival CSS keyframes (drop, squash, rings, stamp). The board looks alive from here.
5. StringLayer with the stroke-dashoffset draw.
6. usePhysics: velocity and walls, then pair collisions, then the string spring.
7. Density tiers + 51st-join exit.
8. Admin, error states, reduced motion, dings.
