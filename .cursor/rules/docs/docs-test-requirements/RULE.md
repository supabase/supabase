---
description: "Docs: how to run tests locally (Supabase setup + correct commands)"
globs:
  - apps/docs/**/*.{test,spec}.{ts,tsx}
alwaysApply: false
---

# Docs test requirements

Before running tests for `apps/docs`, ensure local Supabase is available and the DB is in a known state.

## Recommended sequence

```bash
pnpm supabase status
pnpm supabase start        # if not running
pnpm supabase db reset --local
pnpm run -F docs test:local:unwatch
```

## Notes

- Always reset the local DB before running docs tests to avoid state leakage.
- Prefer `test:local:unwatch` for non-watch CI-like runs.

