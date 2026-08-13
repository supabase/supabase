# Supabase Workers — agent skill

> Mirrors `apps/studio/lib/constants/workers.ts` (`WORKERS_SKILL_MARKDOWN`), the copy the dashboard's "Copy SKILL.md" button emits. Keep the two in sync.

Deploy and manage managed compute (microVMs) that run next to a Supabase project's Postgres.

## Deploy from `config.toml`

Add a block to `supabase/config.toml`:

```toml
[workers.embed]
runtime   = "python"   # node | deno | bun | python | dockerfile
size      = "2x1"      # 2x1 (2GB/1vCPU) | 4x2 (4GB/2vCPU) — fixed at deploy
access    = "public"   # public | private
instances = 1          # 1..10 per deploy; 100 cap per project
secrets   = ["OPENAI_API_KEY"]   # names only — values live in the Secrets API
```

Then run:

```bash
supabase workers deploy embed
```

Config precedence: `--flag` > `config.toml` > interactive prompt > default.

## Conventions

- Workers under `supabase/workers/<name>/` are auto-discovered; the folder name is the slug.
- `entrypoint` is inferred from the runtime (node index.js, deno run main.ts, python main.py, Dockerfile CMD).
- `region` is locked to `us-west-1` at alpha — do not set it.
- Sizes are fixed at deploy time. To change size, delete the worker and redeploy.
- `DATABASE_URL` is injected automatically; other secrets resolve from the Secrets API by name.

## Manage

```bash
supabase workers list
supabase workers logs <name> --follow
supabase workers delete <name>
```

## Failure recovery

- **Build failed** (`exit 1`) — the worker ends `errored`. Fix the Dockerfile/entrypoint/deps and `supabase workers deploy <name>` again (a redeploy from `errored` is supported).
- **Cap hit** (`exit 2`) — the project is at the 100-instance cap. Lower `instances` or delete a worker, then redeploy.
- **Duplicate name** (`exit 3`) — pick a different `<name>` or delete the existing worker first.
- **Crash / unresponsive at runtime** — the worker flips to `errored`; check `supabase workers logs <name>` for the reason (`did not respond on $PORT` = health check), fix, and redeploy.
