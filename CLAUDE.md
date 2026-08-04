# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

A Windows 95 desktop simulator: one route (`/`) renders a desktop whose icons open
draggable windows, each containing a small app. Next.js 16 App Router, React 19,
Tailwind 3, pnpm. Deployed to Vercel.

## Commands

```bash
pnpm dev            # next dev -- fast, but the chatroom cannot connect (see below)
pnpm dev:chat       # vercel dev -- required for the chatroom's WebSocket
pnpm build          # next build (Turbopack)
pnpm lint           # eslint . -- `next lint` was removed in Next 16
npx tsc --noEmit    # typecheck; not run by build
```

No test framework is configured. Verification is done by running the app.

`pnpm dev:chat` needs Vercel CLI **≥54.14.2** and a linked project. Environment
comes from `.env.development.local` (`vercel env pull`); `REDIS_URL` must be the
`rediss://` endpoint, since the Upstash REST client cannot `SUBSCRIBE`.

## Architecture

### Windows

`Desktop.tsx` holds an array of open windows in state. `Window.tsx` wraps each in
`react-draggable` and switches on `name` to pick the app component. Adding an app
means touching both: an icon in `Desktop.tsx` and a case in `Window.tsx`'s
`renderApp` switch. Z-order is a module-level counter incremented on mousedown.

### Identity — spans three files, and is easy to break

1. `src/proxy.ts` (the Next 16 `proxy` convention, formerly `middleware`; matcher
   is `/`) generates a random name, sets it as an **httpOnly** cookie, and
   forwards it on the **request** headers via
   `NextResponse.next({ request: { headers } })`.
2. `page.tsx` reads it with `headers()`. This only works because the proxy put it
   on the *request*. Setting it on the response instead makes every visitor render
   as `"Anonymous"` with no error anywhere.
3. `api/ws` re-resolves the name from the cookie at handshake and stamps it onto
   every message server-side.

Clients never send `sender`. That is the impersonation guard, not an oversight.

### Chatroom / WebSocket

`src/app/api/ws/route.ts` upgrades via `experimental_upgradeWebSocket()` from
`@vercel/functions`. Constraints that shape the whole design:

- **Needs Next 16+.** The function looks for `upgradeWebSocket` on the Vercel
  request context; on Next 14 it threw "not available in the current runtime".
  It also requires `ws` to be installed even though nothing imports it directly.
- **`next dev` cannot upgrade sockets.** Only `vercel dev` can. Under `pnpm dev`
  the chatroom correctly shows "Disconnected - reconnecting..." with the input
  disabled — that is the degraded path working, not a bug.
- **Vercel instances cannot see each other's connections.** All fan-out goes
  through Redis pub/sub (`src/lib/redis.ts`). Messages are *published, never sent
  to local sockets directly*, so the sender receives its own message back through
  the subscription and every client sees one ordering.
- **Sockets are cut at the function's max duration** (300s on Hobby), so
  reconnection is routine rather than an error path, and history replay on connect
  is what makes that invisible.

History is a Redis sorted set scored by timestamp: newest 50, nothing older than
24h, with both limits applied on write and the age bound re-applied on read.

Two failure modes already fixed here, worth not reintroducing:

- The origin check must **not** compare `Origin` against a single header. On the
  upgrade path the proxy rewrites both `host` and `x-forwarded-host` to its own
  socket address (`[::1]:3000` locally), so any single-header comparison rejects
  every real client while plain GETs still look fine.
- `attachDatabasePool()` from `@vercel/functions` does **not** support ioredis —
  it detects Redis by `options.socket`, which is node-redis's shape — and throws
  on every connection, failing the upgrade.

### Name colours

`src/lib/colors.js` is the single source. Only palette **hex values** cross the
wire; the client sends a key and the server resolves it. `toColorKey` is total, so
`NAME_COLORS[toColorKey(x)]` is always safe to index. Never let a client-supplied
string reach a CSS class or style value — that was a real injection hole, and
sending hex rather than Tailwind classes is also what keeps the purger from
dropping the colours.

## Gotchas

- **Lazy-initialize any module-scope client** (OpenAI, Redis). `next build`
  imports every route module during page-data collection, so a constructor that
  throws on a missing env var fails the entire build.
- **ESLint is pinned to 9.** `eslint-plugin-react`, transitive via
  `eslint-config-next`, declares a peer of `≤9.7` and crashes on ESLint 10.
- **`vercel dev` dies on a rejected WebSocket handshake** with an unhandled
  `ECONNRESET`. Each crash orphans the inner `next dev`, which keeps holding
  `.next/dev/lock`; the next start then fails with "Another next dev server is
  already running". Kill the orphaned PID before restarting.
- `@next/codemod` subcommands fail on this machine because the home directory
  path contains a space.
