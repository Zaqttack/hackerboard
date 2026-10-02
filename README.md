# Hackerboard

A live board for the RowdyHacks XII talk "Build a website with AI". Scan the QR code, type a name, and you appear on the big screen as a floating bauble pinned to a cork board.

Vite, React, TypeScript, Tailwind, and a Cloudflare Worker with D1. Deployed with GitHub Actions.

## Run locally

```sh
pnpm install
pnpm dev
```

For the API too:

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
