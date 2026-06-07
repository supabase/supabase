# Console fork — notes

This is a **fork of [supabase/supabase](https://github.com/supabase/supabase)**, adapted to serve
as the platform dashboard for `supabase-console` (the Pointless AI control plane). Personal use.

The `upstream` git remote points at the original `supabase/supabase`; re-sync with
`git fetch upstream`.

## Scope of the checkout

Shallow + sparse clone. Sparse paths: `apps/studio`, `packages`, `patches`.

## Local modifications vs upstream (keep this list current for re-sync)

- `apps/studio/.env.local` (gitignored) — platform-mode local dev config:
  `NEXT_PUBLIC_IS_PLATFORM=true`, `NEXT_PUBLIC_API_URL=http://localhost:8082/api` (→ our BFF),
  `CONSOLE_API_URL=http://localhost:3000` (backend), auth/site URLs pointed at our control-plane.

### Increment 1 — Auth (better-auth shim)
- `packages/common/console-auth.ts` (NEW) — fetch-based shim implementing the GoTrue AuthClient
  surface the dashboard uses (`initialize`, `onAuthStateChange`, `getSession`, `refreshSession`,
  `signInWithPassword`, `signOut`, `mfa.*`), translating better-auth `/api/auth/*` responses into
  GoTrue-shaped `{data,error}`. Unimplemented methods resolve to a benign error via a Proxy.
- `packages/common/gotrue.ts` — `gotrueClient` now points at `consoleGotrueShim` (original
  `AuthClient` kept as `_gotrueClient` for reference / upstream re-sync).
- `apps/studio/next.config.ts` — `rewrites()` proxies `/api/auth/:path*` →
  `${CONSOLE_API_URL}/api/auth/:path*` so the session cookie is same-origin.
- `apps/studio/proxy.ts` — the hosted-mode 404 guard now bypasses `/api/auth/*` and `/api/platform/*`
  (our proxied + BFF paths) via `CONSOLE_FORK_PREFIXES`.

> Backend (separate `supabase-console` repo) change for Inc 1: `src/auth/auth.ts` adds `APP_URL`
> (the dashboard origin) to better-auth `trustedOrigins` so proxied sign-in passes the origin check.

## How to run (Increment 0)

The upstream `dev` script uses POSIX `${STUDIO_PORT:-8082}` which fails on Windows shells. Run
Next directly instead:

```
cd apps/studio
pnpm exec next dev -p 8082
```

Then open http://localhost:8082/sign-in.

## Integration plan

See `supabase-console/docs/superpowers/specs/2026-06-06-phase-4-ui-dashboard-design.md`. Three
seams: better-auth client shim (replaces GoTrue), BFF in `pages/api/platform/*` (translates
studio's `/platform/*` calls to our `/api/v1`), per-project internal screens deferred to each
project's own studio container.
