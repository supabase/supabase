# Supabase Docs

Next.js app router + MDX. Dev server: `pnpm dev:docs` → http://localhost:3001/docs (the bare `/` 404s).

## Skills — load before working

`pm-the-docs`, `write-the-docs`, `edit-the-docs`, `ask-the-docs`, and `review-the-docs` back the docs authoring process — see `CONTRIBUTING.md` for which stage each covers. For architecture questions (MDX pipeline, GraphQL endpoint, search embeddings, federated docs, build pipeline), `ask-the-docs` has the reference notes.

## Test requirements

Before running tests for `apps/docs`, ensure local Supabase is available and the DB is in a known state.

### Recommended sequence

```bash
pnpm supabase status
pnpm supabase start        # if not running
pnpm supabase db reset --local
pnpm run -F docs test:local:unwatch
```

### Notes

- Always reset the local DB before running docs tests to avoid state leakage.
- Prefer `test:local:unwatch` for non-watch CI-like runs. Append a path to run a single file: `pnpm run -F docs test:local:unwatch internals/internal-links.test.ts`.
- `pnpm test` (from `apps/docs`) wraps `test:local` in `supabase start` / `supabase stop`, but does not reset the DB and runs in watch mode, so it is not a substitute for the sequence above.
- MDX content lint is `pnpm lint:mdx` (from `apps/docs`); it lints the whole `content/` tree and takes no path arguments.
