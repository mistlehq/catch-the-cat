# Catch the Cat

A tiny Cloudflare Worker demo app for Mistle webhook flows. The game is intentionally simple: catch the cat head, watch it speed up, and use the deterministic fault control when you need an error event for Sentry.

## Tooling

This project uses mise to pin Node and pnpm:

```sh
mise install
mise exec -- pnpm install
```

## Development

```sh
mise exec -- pnpm dev
```

## Deploy

```sh
CLOUDFLARE_ACCOUNT_ID=<account-id> mise exec -- pnpm deploy
```

## Sentry

Create a Sentry JavaScript project and add its DSN as a Cloudflare Worker secret:

```sh
mise exec -- pnpm exec wrangler secret put SENTRY_DSN
```

Then redeploy:

```sh
CLOUDFLARE_ACCOUNT_ID=<account-id> mise exec -- pnpm deploy
```

## Deterministic Error

The Worker returns a stable `500` error payload when this URL is requested:

```text
/api/demo-error?code=mistle-demo
```

The in-app `!` and `Fault` controls call that endpoint and then throw a stable browser error:

```text
MISTLE_DEMO_WORKER_ERROR: deterministic cat fault
MISTLE_DEMO_CLIENT_ERROR: deterministic cat fault
```

Those fixed error messages are intended for Sentry setup demos, where Mistle can receive Sentry webhooks and fan the issue out to Linear, Slack, and an agent session. The Worker-side demo response is handled instead of thrown so expected demo traffic does not create unhandled Worker exceptions.
