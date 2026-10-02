# Prompt for Claude Design

Paste everything below the line.

---

Design a small web app called **Hackerboard** for a live conference talk at **RowdyHacks XII** (a student hackathon). It's a 3-screen product: a projected "board" that audience members appear on, a mobile join form, and a tiny admin page. I need a complete visual design system plus all screens and states, ready to hand to a developer implementing in React + Tailwind.

## The concept
During my talk, a desktop display shows the Hackerboard. Attendees scan a QR code on the board, type their name on their phone, and instantly appear on the board as a floating "bauble": a rounded bubble containing a random animal emoji and their name. Baubles drift around the screen and gently bump into each other. The room should feel like a living, playful, hacker-flavored space that fills up as people join. Max 50 baubles on screen at once.

## Audience and vibe
- Students and engineers at a hackathon. Energetic, a little nerdy, confident, not corporate.
- This year's RowdyHacks site is a **detective cork board / heist case file**: cork background, torn cream paper, red string between pins, yellow masking tape labels, handwritten type, rubber stamps ("CLASSIFIED", "TOP SECRET"), polaroids, redacted black bars. Hackerboard should feel like it belongs on that same wall, with a playful twist: attendees are "recruits" joining the crew, shown as floating baubles. Screenshots of the RowdyHacks site are attached as inspiration.
- Please propose **2 distinct visual directions** first (one-paragraph rationale each, plus a palette swatch and a mock of the board), then fully develop the one I pick. Direction A should stay close to the cork-board world. Direction B should be a bolder, more "hacker" take (dark, glow, mono type) that still shares the palette accents. If you must choose without me, pick the one that reads best on a projector.
- Brand palette (approximate, sampled from the RowdyHacks site; refine for contrast):
  - Cork: `#B8864B` (dark edge `#9A6B36`)
  - Paper: `#E8E6DF` (shadow `#CFCBC0`)
  - String / stamp red: `#B3261E`
  - Masking-tape yellow: `#E8C85A`
  - Ink: `#1A1A1A`
  - Pin steel: `#3A3A3A`
- Do NOT reuse RowdyHacks logos, the mascot, MLH badge, photos, or texture images. Recreate the cork, paper, tape, stamp, and string looks with original CSS/SVG.

## Screen 1: The Board (root `/`)  — primary, most important
- Target: **1920x1080 desktop display, projected in a room**. Must read from the back row. Assume washed-out projectors: strong contrast, no subtle low-contrast text or thin hairlines.
- **Hero zone**: event title ("RowdyHacks XII"), product name ("Hackerboard"), and a one-line prompt like "Scan to join the board". Hero should not dominate; baubles are the star. Hero content should stay readable even when baubles drift behind/near it (decide: baubles avoid the hero zone, or hero sits on a layer above with a backing).
- **QR code**: tucked in a top corner (left or right, your call), minimum ~220px, with a mandatory quiet zone and a light background tile behind the code (QR needs dark-on-light contrast). Under it, short instruction text and the plain URL as a text fallback. Leave a placeholder box labeled "QR" and specify exact size and position.
- **Baubles**: rounded bubble (circle or pill, your call) containing a large animal emoji and the person's name (up to 20 characters, shown in full). Specify sizes, padding, name type size (legible from far away), and 5-6 background/border color variants assigned randomly. Baubles must look good overlapping and at different sizes (slight size variation is welcome).
- **Board background**: the cork board feel (or the Direction B equivalent). Subtle texture, but visible on a projector. Baubles need to stand out against it: consider paper-white or tape-yellow bubbles with a dark ink name, a pin or tape detail, and optional thin red string linking recent joiners.
- **States to design**: (1) empty board, so the very start of the talk still looks intentional, (2) ~10 baubles, (3) 50 baubles at full density, (4) a new arrival pop-in moment.
- **Motion spec** (I want it flashy, not minimal). Describe with timing/easing values:
  - New arrival: dramatic entrance (e.g. drop/pop in with squash-and-stretch and a brief glow/ring burst), then settles into the drift.
  - Idle: slow floating drift; soft collisions where baubles bounce off each other and the screen edges.
  - Optional: a subtle "ding" visual (ripple, sparkle) on collisions or on join.
  - Provide a calm `prefers-reduced-motion` variant.
  - Note anything that would be expensive for 50 animated elements and propose a cheaper alternative.

## Screen 2: Join (`/join`) — mobile
- Target: **390x844** phone, opened from a QR scan in a loud room, one hand.
- One field: **name** (max 20 characters, live character counter), one big button. Keep it nearly instant to complete. Large touch targets (44px+).
- Visually echo the board (same colors, bauble motif) so it feels connected.
- **States**: idle, typing, name too long/empty, submitting, **success** (a celebratory reveal of their assigned random animal emoji, "You're on the board!"), already-signed (they already joined from this device), rejected (name not allowed, friendly tone), network error with retry.
- Reserve a slot for a Turnstile (Cloudflare captcha) widget, shown as a placeholder in a "verifying" state.

## Screen 3: Admin (`/admin`) — desktop, utility
- Simple, functional, still on-brand. Passphrase field, a red "Wipe the board" button, a confirm step, success state, wrong-passphrase state. Minimal.

## Design system deliverables
- Color tokens (background, surface, text, accent, 5-6 bauble colors, danger/success), with contrast ratios noted (aim for WCAG AA minimum; higher on the board).
- Typography: pick fonts available on **Google Fonts**, with a size scale for the board (far-viewing) and for mobile. Handwritten display (like Reenie Beanie or Caveat), typewriter for stamps (like Special Elite), readable serif or sans for body. Handwriting must stay legible at projector distance, so use it for the title and labels, not for long text.
- Spacing, radii, border/glow/shadow tokens.
- Name the tokens in a way that maps cleanly to CSS variables / Tailwind theme.
- Emoji: a curated list of ~30 animal emoji suitable for the baubles. Design assuming emoji render with varying styles across OSes.

## Constraints
- Implemented in React + Vite + Tailwind. Prefer CSS/SVG effects over heavy raster images.
- Everything must work with no photographic assets.
- Keep the design buildable in ~20 minutes of live AI-assisted coding: avoid exotic one-off effects that are hard to reproduce in code; where an effect is complex, note a simpler fallback.
- The board must look great at full density (50 baubles) AND empty.

## Output
1. The 2 direction proposals first, then wait for my pick.
2. After my pick: all three screens with all listed states, the token sheet, and the motion spec.
3. A short developer handoff note: layout structure, component list (Bauble, QRCard, Hero, JoinForm, etc.), and what to build first.
