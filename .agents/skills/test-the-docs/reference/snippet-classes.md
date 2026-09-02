# Snippet classes

Classify each extracted artifact before running it.

| Class | Meaning | Run? |
| ----- | ------- | ---- |
| `runnable-local` | Complete CLI, SQL, or script that works against a local stack or temp dir | Yes |
| `runnable-with-setup` | Needs migrations, seed data, `.env`, or prior steps from the same page | Yes, after setup |
| `example-app` | `$CodeSample` or path under `examples/` | Build (`npm install && npm run build`) |
| `illustrative-only` | Incomplete on purpose, omits required context, or is conceptual | No |
| `deferred` | Needs production, paid feature, destructive op, or missing Docker/CLI | No — record reason |

## Safety

- Prefer read-only SQL and non-destructive CLI flags.
- Never target a linked hosted/production project from this skill.
- Do not print secrets (service role keys, PATs) into Verification notes or logs.
- Mark incomplete copy-paste blocks `illustrative-only` rather than forcing a run that cannot succeed.

## Language heuristics

| Fence | Typical class |
| ----- | ------------- |
| `sql` | `runnable-local` or `runnable-with-setup` if ordered migrations |
| `bash` / `sh` | `runnable-local` if self-contained; else `deferred` / `illustrative-only` |
| `javascript` / `typescript` / `tsx` / `jsx` | Often `illustrative-only` unless a full runnable script or example-app path |
| `mermaid` | Skip (not executable) |
