# Universe lookup (employees)

Cross-repo product search for Frame/Shape when a feature may span services. Use this during `/pm-the-docs`, not `/ask-the-docs` (`ask-the-docs` stays on `apps/docs` architecture).

[`supabase/universe`](https://github.com/supabase/universe) aggregates core platform repos as git submodules under `repos/` so you can search the whole product surface from one workspace.

## Availability

Resolve the universe root in order:

1. `$SUPABASE_UNIVERSE_ROOT` (if set)
2. `$HOME/GitHub/supabase/universe`

```bash
UNIVERSE_ROOT="${SUPABASE_UNIVERSE_ROOT:-$HOME/GitHub/supabase/universe}"
```

If that directory does not exist, **do not assume access**. Fall back to:

- `gh search code --owner supabase '<query>'` (and other orgs named in the ticket)
- Any product repo already linked from Linear / the PR

Do not hardcode machine-specific absolute paths (for example a single laptop home directory) in committed skill files.

## Initialize submodules

If `repos/` is empty or missing expected checkouts:

```bash
cd "$UNIVERSE_ROOT"
git submodule update --init --recursive
```

Private submodules (`platform`, `branching`) may need a PAT; public submodules are enough for most docs grounding. If init fails for a private repo, note that and search the public ones plus `gh search`.

## Where to look

Start from the universe README "Finding your way around" table, then `rg` inside the relevant submodule:

| Looking for… | Start in |
| ------------ | -------- |
| Schema, extensions, RLS | `repos/postgres/`, `repos/postgrest/`, `repos/pg-toolbelt/` |
| Auth flows | `repos/auth/`, `auth-js` under `repos/supabase-js/` |
| Realtime / Storage / Edge Functions | `repos/realtime/`, `repos/storage/`, `repos/edge-runtime/` |
| Dashboard / Studio | `repos/supabase/apps/studio` |
| Management API / hosted infra | `repos/platform/` (private) |
| CLI, local dev, `config.toml` | `repos/cli/` |
| Docs & self-hosting Compose | `repos/supabase/` (`apps/docs`, `docker/`) |

When scope is unknown, search initialized `repos/**` with a tight pattern rather than reading entire trees.

## How to use in Frame / Shape

1. Name the product surfaces the launch might touch (CLI, Auth, migrations, Dashboard, …).
2. Resolve those to submodule paths above.
3. Confirm with a short search whether behavior lives in one repo or several.
4. Record in the Frame/Shape summary: repos consulted, confirmed cross-cutting vs single-repo, and any gaps.

If universe is unavailable, say so and use the fallback search — still distinguish confirmed fact from inference.
