# Hackerboard

A live board for the RowdyHacks XII talk "Build a website with AI". Scan the QR code, type a name, and you appear on the big screen as a floating bauble pinned to a cork board. Everything here was built with Claude.

Vite, React, TypeScript, Tailwind v4, matter.js, and a Cloudflare Worker with D1. Deployed with GitHub Actions.

## Run locally

```sh
pnpm install
pnpm dev
```

For the API too, copy `.dev.vars.example` to `.dev.vars` (it sets the local `/admin` passphrase), then:

```sh
pnpm run cf:dev
```

Other scripts: `pnpm run typecheck`, `pnpm test`, `pnpm run build`.

## Pages

- `/` the board (made for a projector)
- `/join` add yourself from your phone
- `/admin` passphrase-protected: stats, everyone in join order (with who has been bumped off), and a wipe button

The board shows the 50 newest people. Nobody is turned away: when a 51st person joins, the oldest bauble falls off.

## Deploy your own

1. Fork this repo.
2. In Cloudflare, create an API token with **Workers Scripts: Edit** and **D1: Edit**, and note your account ID. (That token can edit every Worker in the account, so give it an expiry.)
3. In your fork, go to Settings, Secrets and variables, Actions, and add these secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `ADMIN_KEY`, the passphrase for `/admin` (use a long one)
4. Optional, bot protection: create a Turnstile widget for your `workers.dev` hostname, then add the secret `TURNSTILE_SECRET` and the repository variable `VITE_TURNSTILE_SITE_KEY`. Without them `main` runs with no captcha. Every other branch uses Cloudflare's always-pass test keys.
5. Push to `main`, or run the **Test & Deploy** workflow from the Actions tab.

The workflow creates the D1 database, applies migrations, deploys the Worker, sets the secrets and smoke-tests it. Nothing else to configure.

## Every branch is a deployment

| Branch | Worker and database |
|---|---|
| `main` | `hackerboard` |
| `demo*`, `rehearsal*` | `hackerboard-<branch>` |

Each deployment has its own database, so test data never touches `main`.

- Deleting a `demo*` or `rehearsal*` branch deletes its Worker and database (`cleanup.yml`).
- To empty a board without the admin page, run the **Wipe board** workflow on that branch.

## Run the demo

The talk rebuilds this app live from the `demo-start` tag by pasting prompts in order. See [docs/DEMO.md](docs/DEMO.md) for the runbook and the prompts. Design spec: [docs/hackerboard/DESIGN.md](docs/hackerboard/DESIGN.md), with notes on where the finished app differs and the traps to avoid in [docs/hackerboard/IMPLEMENTATION-NOTES.md](docs/hackerboard/IMPLEMENTATION-NOTES.md).

## Security

Names are validated on the server with an allowlist, every database query uses bound parameters, user text is only rendered as text, POSTs are same-origin JSON only, joins are throttled and (on `main`) behind Turnstile, the admin passphrase is compared in constant time with a lockout, and a strict CSP is set in `public/_headers`. The rules are in [CLAUDE.md](CLAUDE.md).

## License

MIT
