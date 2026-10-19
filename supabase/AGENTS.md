# Supabase project (`supabase/`)

Linked to the hosted project `xguihxuzqibwxjnimxev`, used by docs, www and studio. Run the CLI with `pnpm supabase …` from the repo root.

## Database changes use the declarative schema

`supabase/schemas/` is the source of truth for the current database state (configured via `[db.migrations] schema_paths` in `config.toml`). `supabase/migrations/` is the applied history and is generated from it.

To change the database:

1. Edit the matching file under `supabase/schemas/<schema>/<kind>/<name>.sql` (`tables/`, `functions/`, `views/`, `types/`, `sequences/`). Create a new file for a new object. Extensions and publications live in `schemas/_cluster/`.
2. Generate the migration: `pnpm supabase db schema declarative sync --experimental --name <short_snake_case_name> --no-apply`. The declarative commands need `--experimental` because `[experimental.pgdelta]` isn't enabled in `config.toml`.
3. Review the generated file in `supabase/migrations/`. Remove noise that comes from the local Postgres image rather than your change (for example `COMMENT ON EXTENSION "vector"`, `DROP EXTENSION "pgjwt"` or `vector` function grants). On a clean tree, `sync` should produce only that noise; if it produces nothing else, delete the generated file.
4. Apply locally with `pnpm supabase db reset` and confirm the app still works.

Rules:

- Never write a migration by hand for something that belongs in `schemas/`, and never edit `schemas/` without generating the matching migration. The two must stay in sync.
- Never edit or delete an existing migration. Add a new one.
- Don't run `pnpm supabase db pull --declarative` or `declarative generate` against the linked project to "refresh" `schemas/`: both replace the whole tree and discard uncommitted edits. Use them only to re-baseline after drift, into a clean working tree, and review the diff.
- Don't run `db push`, `supabase pull`, or anything else that writes to the hosted project (including its migration history) unless the user asks.
- Anything a migration needs that `schemas/` can't express (data backfills, one-off statements) goes in the migration only.

Checking for drift against the hosted project:

```bash
pnpm supabase db diff --use-pg-delta --from migrations --to linked -o <scratch-file>.sql
```

If the shadow database fails to start with a missing `supabase_read_only_user` role, `supabase/.temp/postgres-version` pins an outdated image (written by `supabase link`). Point it at a recent cached image tag (for example `15.8.1.085`) and retry.

## Other things in this directory

- `config.toml`: local config plus `[remotes.prod]` overrides pulled with `pnpm supabase config pull`.
- `functions/`: edge functions (`search-embeddings`, `og-images`, …).
- `buckets/`: storage bucket definitions. Only `fonts` is defined locally; `images` and `videos` exist only on the hosted project.
- `seed.sql`: local seed data.
- Regenerate TypeScript types with `pnpm generate:types` after schema changes. Never hand-edit `functions/common/database-types.ts`.
