# `supabase workers` CLI

Prototype spec for the Workers CLI surface. Shapes the design conversation; the real CLI is built in parallel.

## Commands

```bash
supabase workers deploy <name> [flags]   # build + schedule; streams lifecycle
supabase workers list                    # table: name, state, runtime, access, region, resources
supabase workers logs <name> [--follow]  # tail lifecycle + request logs
supabase workers delete <name>           # drain then kill
```

## `deploy` flags

| Flag | Values | Default |
| --- | --- | --- |
| `--runtime` | node \| deno \| bun \| python \| dockerfile | inferred from files |
| `--size` | 2x1 \| 4x2 | `2x1` |
| `--access` | public \| private | `private` |
| `--instances` | 1..10 | `1` |
| `--root` | path | derived from `directory/<name>` |

## Config resolution

Precedence: `--flag` > `config.toml [workers.<slug>]` > interactive prompt > default.

With nothing specified, the CLI prompts for stack / size / access / instances / root (region is disabled — locked to `us-west-1`) and offers to write the answers back to `config.toml`. See `config-toml.md`.

> The CLI *writing* answers back to `config.toml` on first run is a separate UX call — the *reading* path is table stakes; defer the write-back design.

## Failure exit codes

| Code | Meaning | Surface |
| --- | --- | --- |
| `1` | build failure (Dockerfile / entrypoint / deps) | streamed; worker ends `errored` |
| `2` | instance cap hit (would exceed 100/project) | rejected before deploy |
| `3` | duplicate name | rejected before deploy |
| `4` | auth / permission | rejected before deploy |

Errors are surfaced verbatim in the dashboard (toast + Overview alert) so the CLI and dashboard tell the same story.
