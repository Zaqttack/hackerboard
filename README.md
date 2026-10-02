# Hackerboard

A live board for the RowdyHacks XII talk "Build a website with AI". Scan the QR code, type a name, and you appear on the big screen as a floating bauble pinned to a cork board.

Vite, React, TypeScript, Tailwind, and a Cloudflare Worker with D1. Deployed with GitHub Actions.

## Run locally

```sh
pnpm install
pnpm dev
```

For the API too, copy `.dev.vars.example` to `.dev.vars` (it sets the local `/admin` passphrase), then:

```sh
pnpm run cf:dev
```

## Deploy your own

1. Fork this repo.
2. In Cloudflare, create an API token with **Workers Scripts: Edit** and **D1: Edit**, and note your account ID.
3. In your fork, go to Settings, Secrets and variables, Actions, and add these secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `ADMIN_KEY`, the passphrase for `/admin`
4. Push to `main`, or run the workflow manually from the Actions tab.

5. Optional, bot protection: create a Turnstile widget in Cloudflare, then add the secret `TURNSTILE_SECRET` and the repository variable `VITE_TURNSTILE_SITE_KEY`. Without them `main` runs with no captcha. Every other branch uses Cloudflare's always-pass test keys.

The workflow creates the D1 database, applies migrations, deploys the Worker, and sets the secrets. Nothing else to configure.

## Every branch is a deployment

| Branch | Worker and database |
|---|---|
| `main` | `hackerboard` |
| `demo*`, `rehearsal*` | `hackerboard-<branch>` |

Each deployment has its own database, so test data never touches `main`.

## Pages

- `/` the board
- `/join` add yourself from your phone
- `/admin` wipe the board (passphrase)

Deleting a `demo*` or `rehearsal*` branch deletes its Worker and database (see `cleanup.yml`). To empty a branch's board without the admin page, run the **Wipe board** workflow on that branch.
