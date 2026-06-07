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
  auth/site URLs pointed at our control-plane. No upstream source files changed yet.

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
