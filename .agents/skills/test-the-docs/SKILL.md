---
name: test-the-docs
description: >-
  Execute runnable docs snippets and examples against a Docker-isolated local
  Supabase stack (`supabase start` in a temp project). Use after Draft or during
  Self-review when asked to test the docs, fact-check CLI/SQL/code samples, or
  produce a Verification table for a docs PR. Complements review-the-docs
  lint/build checks; does not replace them.
---

# Test the docs

Runs procedural docs content against a **Docker-isolated local stack**, not production. Produces a Verification table for the PR body / self-review note.

For lint, markdown rebuilds, example-app builds, and PR triage, use [`review-the-docs`](../review-the-docs/SKILL.md). For Frame/Shape and cross-repo product lookup, use [`pm-the-docs`](../pm-the-docs/SKILL.md).

## When to invoke

- After Draft, before or during Self-review (checklist Stage 4).
- Standalone: "test the docs", "fact-check these snippets", "run the examples".
- Content or tutorial PRs that add or change procedural fenced blocks.

**Not for:** generated reference pages, docs-app architecture questions, or hosted/production projects.

## Core rules

1. **Never run against production.** Local stack or temp dir only.
2. **Default sandbox** is Docker + `supabase start` in a temp project — see [reference/sandbox-setup.md](reference/sandbox-setup.md).
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

| Class | Action |
| ----- | ------ |
| `runnable-local` | Run in temp stack / temp dir |
| `runnable-with-setup` | Run after documented setup (migrations, seed) |
| `example-app` | `npm install && npm run build` in `examples/…` |
| `illustrative-only` | No run required |
| `deferred` | Record reason; do not silently skip |

### 4. Sandbox setup

Follow [reference/sandbox-setup.md](reference/sandbox-setup.md):

1. Refuse if running as root.
2. Require `docker` + `docker info` and the `supabase` CLI.
3. `TMP=$(mktemp -d)` → `supabase init` → `supabase start` when DB/API behavior is involved.
4. CLI-only blocks with no DB: separate `mktemp -d` without starting the stack.
5. Always `supabase stop` and remove the temp dir (cleanup trap).

If Docker or the CLI is unavailable, mark in-scope snippets `deferred` with that reason — never silent skip.

### 5. Execute

- **Tier A:** one copy-pasteable end-to-end path from the page.
- **Tier B:** each new/changed block classified `runnable-*`.
- Capture exit code, stdout/stderr, and observed vs expected behavior.

### 6. Report

Write a Verification table per [reference/verification-report.md](reference/verification-report.md) for the PR body / self-review note.

## Related skills

- [`write-the-docs`](../write-the-docs/SKILL.md) — Draft; hands off here before PR
- [`review-the-docs`](../review-the-docs/SKILL.md) — lint/build/classify; consumes Verification table
- [`pm-the-docs`](../pm-the-docs/SKILL.md) — Frame/Shape; universe for cross-repo product lookup
