---
name: test-the-docs
description: >-
  Execute runnable docs snippets and examples inside a disposable Docker Compose
  sandbox (runner container + local Supabase stack via `supabase start`). Use
  after Draft or during Self-review when asked to test the docs, fact-check
  CLI/SQL/code samples, or produce a verification report for a docs PR.
  Complements review-the-docs lint/build checks; does not replace them.
---

# Test the docs

Runs procedural docs content **inside disposable containers**, not on the host shell and not against production. Produces a verification report for the PR body / self-review note.

For lint, markdown rebuilds, example-app triage, and PR review, use [`review-the-docs`](../review-the-docs/SKILL.md). For Frame/Shape and cross-repo product lookup, use [`pm-the-docs`](../pm-the-docs/SKILL.md).

## When to invoke

- After Draft, before or during Self-review (checklist Stage 4).
- Standalone: "test the docs", "fact-check these snippets", "run the examples".
- Content or tutorial PRs that add or change procedural fenced blocks.

**Not for:** generated reference pages, docs-app architecture questions, or hosted/production projects.

## Core rules

1. **Never run against production.** Local stack or temp dir only.
2. **Never run MDX fences on the host shell.** Use the Compose sandbox — see [reference/sandbox-setup.md](reference/sandbox-setup.md) and [`sandbox/run.sh`](sandbox/run.sh).
3. **Proportional:** Tier A (one end-to-end path) is required; Tier B spot-checks new/changed procedural blocks, not every fence on every page.
4. **Product bugs** found while testing get linked or filed separately; fix docs only when the docs are wrong.

## Phases

### 1. Scope

From explicit MDX paths, or:

```bash
git diff --name-only master...HEAD -- 'apps/docs/content/**'
```

Skip generated reference output under `features/docs/generated/`.

### 2. Extract

List runnable artifacts from changed MDX:

- Fenced blocks: `bash`, `sh`, `sql`, `javascript`, `typescript`, `tsx`, `jsx`
- `$CodeSample` paths → treat as `example-app` (build under `examples/`)
- Skip: `mermaid`, incomplete illustrative fragments, partial-only includes

### 3. Classify

Assign each artifact a class per [reference/snippet-classes.md](reference/snippet-classes.md):

| Class                 | Action                                         |
| --------------------- | ---------------------------------------------- |
| `runnable-local`      | Run in temp stack / temp dir                   |
| `runnable-with-setup` | Run after documented setup (migrations, seed)  |
| `example-app`         | `npm install && npm run build` in `examples/…` |
| `illustrative-only`   | No run required                                |
| `deferred`            | Record reason; do not silently skip            |

### 4. Sandbox setup

Follow [reference/sandbox-setup.md](reference/sandbox-setup.md) and drive lifecycle with [`sandbox/run.sh`](sandbox/run.sh):

1. Refuse if the **host** is running as root.
2. Require `docker` + `docker info` + `docker compose` on the host for any in-container run.
3. Gate profiles **per artifact class**:
   - `runnable-local` / `runnable-with-setup` that need DB/API: `./sandbox/run.sh up-stack` (DinD + runner → `supabase init` / `supabase start` in `/work`).
   - CLI-only blocks with no DB: still use a runner profile so fences stay off-host; skip `supabase start` when unused.
   - `example-app`: `TTD_EXAMPLE_DIR=<repo>/examples/<app> ./sandbox/run.sh up-examples` (Node in runner; **no** DinD). Do **not** defer solely because the host lacks a global Supabase CLI.
4. Always `./sandbox/run.sh down` when finished (cleanup trap on the host session).
5. Capture connection **URLs only** inside the runner; never paste credential fields into notes or logs.

If a **required** prerequisite for that artifact is unavailable, mark that artifact `deferred` with the specific reason — never silent skip, and do not defer unrelated classes.

### 5. Execute

- **Tier A:** one copy-pasteable end-to-end path from the page.
- **Tier B:** each new/changed block classified `runnable-*` **or** `example-app` (build and record the result).
- Run every fence via `./sandbox/run.sh exec` or `exec-timeout` (never a bare host shell).
- Bound every artifact: default **60s** for shell / SQL / JS / TypeScript / `tsx` / `jsx`; allow longer for `example-app` install/build (e.g. **5m**). On timeout, kill the process **group** inside the runner, then record `fail` or `deferred` with reason.
- `curl` / `wget` only to filtered stack URLs (or page-documented local endpoints). `npm` / `npx` / `node` only for mounted `example-app` builds.
- Capture exit code, stdout/stderr (redact secrets), and observed vs expected behavior.

### 6. Report

Write a verification report per [reference/verification-report.md](reference/verification-report.md) for the PR body / self-review note.

## Related skills

- [`write-the-docs`](../write-the-docs/SKILL.md) — Draft; hands off here before PR
- [`review-the-docs`](../review-the-docs/SKILL.md) — lint/build/classify; consumes verification report
- [`pm-the-docs`](../pm-the-docs/SKILL.md) — Frame/Shape; universe for cross-repo product lookup
