# Verification report

Paste into the PR body or self-review note under a **Verification** heading.

## Template

```markdown
## Verification (`/test-the-docs`)

| Snippet / step | Class | Sandbox | Result | Notes |
| -------------- | ----- | ------- | ------ | ----- |
| e.g. `create type …` SQL | runnable-local | temp dir + `supabase start` | pass | |
| e.g. `supabase db diff` | runnable-local | temp dir + local stack | fail | product bug → link issue |
| e.g. paid Dashboard-only step | deferred | — | deferred | needs hosted project |

**Tier A path:** <one-line description of the end-to-end path run>

**Environment:** Docker Desktop <version if known>; supabase CLI <version>; non-root user
```

Do **not** put secrets (`JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, access tokens) in Notes or Environment.

## Results

| Result | Meaning |
| ------ | ------- |
| `pass` | Command exited 0 and matched expected behavior |
| `fail` | Ran but wrong output / non-zero exit — docs wrong **or** product bug |
| `deferred` | Not run; reason required in Notes |
| `skipped` | Out of scope (`illustrative-only`) |

## Product bugs

If the snippet matches the code and still fails:

1. Prefer linking an existing issue in the owning repo.
2. Otherwise note the repro in the PR and file/follow up with the product owner.
3. Do not "fix" the docs to hide a real platform bug without calling it out.
