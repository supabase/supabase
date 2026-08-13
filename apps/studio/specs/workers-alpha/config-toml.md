# Workers `config.toml`

The CLI reads worker configuration from the project's `supabase/config.toml`, mirroring the existing `[functions.<slug>]` shape so Edge Functions users recognize it immediately.

## Example

```toml
# supabase/config.toml — Workers section

[workers]
# Convention: workers under supabase/workers/<name>/ are auto-discovered.
# Set `directory` to override where the CLI looks.
# directory = "./supabase/workers"

[workers.embed]
runtime    = "python"          # node | deno | bun | python | dockerfile
size       = "2x1"             # 2x1 (2 GB / 1 vCPU) | 4x2 (4 GB / 2 vCPU) — fixed, no resize
instances  = 2                 # 1..10 per deploy; 100 cap per project
access     = "public"          # public | private
secrets    = ["OPENAI_API_KEY"]  # names only — values live in the Secrets API
# root       = "./services/embed"   # optional, only if not under directory/<name>
# entrypoint = "python main.py"     # optional, inferred from runtime otherwise
# region is intentionally omitted — locked to us-west-1 at alpha.
```

## Decisions

- **Directory discovery** — with no `[workers.<name>]` block, the CLI scans `directory` (default `./supabase/workers`) and treats each subdirectory as a worker whose slug is the folder name. `[workers.<name>]` blocks override; the two coexist.
- **`root` is derived** when the worker lives under `directory/<name>/`. Only set it when the code lives elsewhere.
- **`entrypoint` is inferred** from the runtime unless overridden:
  | runtime | base image | entrypoint |
  | --- | --- | --- |
  | node | `node:24-slim` | `node index.js` |
  | deno | `denoland/deno:latest` | `deno run main.ts` |
  | bun | `oven/bun:latest` | `bun run index.ts` |
  | python | `python:3.14-slim` | `python main.py` |
  | dockerfile | from `./Dockerfile` | `CMD` |
- **`size` is fixed at deploy time.** There is no resize — to change size, delete the worker and redeploy.
- **`region` is deliberately absent** — locked to `us-west-1`. Adding it later is additive.
- **`secrets` lists names only** — values come from the Supabase Secrets API at deploy time.
- The CLI **prompts interactively** for anything missing and offers to write the answers back to `config.toml`.

## Resolution order

`--flag` > `config.toml [workers.<slug>]` > interactive prompt > default.
