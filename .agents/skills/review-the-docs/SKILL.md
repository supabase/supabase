---
name: review-the-docs
description: >-
  Review Supabase docs changes locally in ~/GitHub/supabase/supabase —
  either an open PR (triage, classify, verify) or your own branch before
  opening a PR (local self-review). Covers markdown pipeline, MDX content,
  tutorials, examples, Studio links, and docs tooling. Use when asked to
  review docs PRs, self-review a draft branch, check who has approved,
  verify build output, or evaluate supabase/supabase documentation changes.
---

# Review docs PRs

Local review workflow for `supabase/supabase` docs changes. Classify first, then follow the matching checklist.

Two modes:

- **Open PR review** (default) — triage via `gh`, checkout, verify, report. Start at [Phase 1](#phase-1--triage-read-only).
- **Local self-review** — no open PR yet; verify the current branch before opening one. Start at [Local self-review](#local-self-review-no-open-pr).

For **implementing** docs fixes (Linear tickets, worktrees, platform E2E), use [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md) instead.

## Core rules

1. **Classify before reviewing** — path patterns determine which checklist applies.
2. **Review stacked PRs bottom-up** — each PR may base on the previous branch.
3. **Run verification locally** — do not approve from diff alone.
4. **Compare against `master`** when the PR claims to fix missing or broken output.
5. **One report per batch** — sequential review, consolidated output at the end.
6. **Separate blockers from nits** — type/style notes are suggestions unless output breaks.

## Repository layout

| Path                                   | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `~/GitHub/supabase/supabase`           | Main clone for review checkouts                           |
| `apps/docs/content/guides/`            | Source MDX                                                |
| `apps/docs/internals/`                 | Markdown pipeline (`generate-guides-markdown.ts`, etc.)   |
| `apps/docs/internals/markdown-schema/` | Component handlers → plain markdown strings               |
| `apps/docs/public/markdown/guides/`    | Generated output (produced by build)                      |
| `apps/docs/components/`                | React MDX components                                      |
| `examples/`                            | Tutorial/quickstart apps referenced via `$CodeSample`     |
| `apps/studio/`                         | Dashboard UI; may link to hosted docs                     |
| `.agents/skills/`                      | In-repo agent skills (symlinked from `.claude`/`.cursor`) |

## Local self-review (no open PR)

Use this on your own branch **before** opening a PR (checklist Stage 4). No `gh pr` required.

```bash
cd ~/GitHub/supabase/supabase
# Ensure you're on the feature branch, not master
git branch --show-current
git diff --name-only master...HEAD
```

1. **Classify** from `git diff --name-only master...HEAD` using the [Phase 2](#phase-2--classify-pr-type) table.
2. **Walk the bar** in [`pm-the-docs`'s checklist](../pm-the-docs/reference/write-the-docs-checklist.md) — "What good looks like" and the Self-review checkboxes.
3. **Run type-specific checks** from the matching sections below on the current branch (no checkout step). Typical commands:

```bash
# Content / tutorial MDX
cd apps/docs && pnpm lint:mdx -- <changed-paths>

# Pipeline / schema handler
cd apps/docs && pnpm build:guides-markdown
# inspect public/markdown/guides/ for affected pages
pnpm build:reference-markdown   # when reference pipeline changed
```

4. Spot-check frontmatter, internal links, and nav wiring for content changes.
5. **Offer runnable verification** — for content/tutorial PRs with new or changed procedural fenced blocks, ask whether to run [`test-the-docs`](../test-the-docs/SKILL.md) (Docker + local CLI). If accepted, include the Verification table; if declined or unavailable, record credible `deferred` reasons. Do not reimplement sandbox execution here.
6. Write a short **self-review note** (blockers vs nits) suitable to paste into the future PR body under a "Self-review" heading.

Then open the PR and continue with open-PR review if a second pass is needed.

## Phase 1 — Triage (read-only)

### List PRs

Filter by author, label, or list all open docs PRs:

```bash
# By author
gh pr list --repo supabase/supabase --author <github-user> --state open \
  --json number,title,url,reviewDecision,latestReviews,changedFiles,additions,deletions,labels

# All open docs-labeled PRs
gh pr list --repo supabase/supabase --state open --label documentation \
  --json number,title,url,reviewDecision,latestReviews,author,changedFiles
```

PRs with empty `reviewDecision` and no `APPROVED` review need approval.

### Map the stack

```bash
gh pr view <number> --repo supabase/supabase \
  --json number,title,baseRefName,headRefName,body,files
```

Stacked series: `master → PR A → PR B → PR C`. Review and merge bottom-up.

## Phase 2 — Classify PR type

Inspect changed files from `gh pr view` or:

```bash
gh pr diff <number> --repo supabase/supabase --name-only
```

| PR type                     | Path signals                                                                                                    | Primary skill section                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Markdown-schema handler** | `apps/docs/internals/markdown-schema/`, `generate-guides-markdown.ts`                                           | [Schema handler review](#schema-handler-review)                |
| **Pipeline / internals**    | `apps/docs/internals/` (not just one new handler)                                                               | [Pipeline review](#pipeline-review)                            |
| **Content-only MDX**        | `apps/docs/content/**` only                                                                                     | [Content review](#content-review)                              |
| **Tutorial / quickstart**   | `apps/docs/content/guides/**/tutorials/`, `quickstarts/`, plus `examples/`                                      | [Tutorial review](#tutorial-review) → also `work-linear-issue` |
| **Example app only**        | `examples/**` without matching MDX                                                                              | [Example review](#example-review)                              |
| **Studio ↔ docs links**     | `apps/studio/**`                                                                                                | [Studio review](#studio-review)                                |
| **Docs UI / components**    | `apps/docs/components/`, `apps/docs/features/` (no pipeline)                                                    | [Component review](#component-review)                          |
| **Docs tooling**            | `.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `apps/docs/CONTRIBUTING.md`, `apps/docs/DEVELOPERS.md` | [Docs tooling review](#docs-tooling-review)                    |
| **Mixed**                   | Multiple path groups above                                                                                      | Run each applicable section; note overlap                      |

When a PR spans types (e.g. schema handler + component refactor), run **all** matching sections.

## Phase 3 — Sequential local review

Repeat for **each PR** (bottom of stack first).

### Common steps (all PR types)

**Checkout and install:**

```bash
cd ~/GitHub/supabase/supabase
gh pr checkout <number> --repo supabase/supabase
pnpm install --filter docs...   # when node_modules missing or deps changed
```

**CI spot-check:**

```bash
gh pr checks <number> --repo supabase/supabase
```

**Baseline on master** (when PR fixes missing/broken output):

```bash
git checkout master
# run type-specific verify command (see sections below)
git checkout -   # return to PR branch
```

---

### Schema handler review

For PRs adding static markdown fallbacks for React MDX components.

**Code checks** — each handler in `apps/docs/internals/markdown-schema/`:

| Check            | What to verify                                                           |
| ---------------- | ------------------------------------------------------------------------ |
| Data source      | Same data/constants as the React component — no duplicated config        |
| CJS interop      | `shared-data` via `createRequire(import.meta.url)` (see `SharedData.ts`) |
| Local JSON       | Direct imports fine for `apps/docs/data/`                                |
| Link prefix      | Links use `withDocsBasePath`                                             |
| SCHEMA wiring    | Registered in `SCHEMA` in `generate-guides-markdown.ts`                  |
| Props / shapes   | All MDX usages covered — flat arrays and `{ items: [...] }` sections     |
| Silent fallbacks | `''` for unknown props OK if consistent with existing handlers           |

Find usages: `rg '<ComponentName' apps/docs/content/`

**Build and inspect:**

```bash
cd apps/docs && pnpm build:guides-markdown
# Expect: Generated 546 markdown files under public/markdown/guides/
```

Inspect `public/markdown/guides/` for affected pages:

- Previously blank sections now have lists, tables, or links
- All MDX pages using the component are covered, not just the one in the PR description
- Link format: `/docs/guides/...` locally; absolute URLs when `VERCEL_ENV=production`

---

### Pipeline review

For AST refactors, link rewriting, reference markdown generation, etc.

```bash
cd apps/docs
pnpm build:guides-markdown
pnpm build:reference-markdown   # when reference pipeline changed
pnpm test internals/internal-links.test.ts   # when link handling changed
```

Verify both guides and reference output when `generate-reference-markdown.ts` or `internal-links.ts` changed.

---

### Content review

MDX prose, partials, navigation — no pipeline or example changes.

```bash
cd apps/docs
pnpm lint:mdx -- <changed-paths>    # or monorepo equivalent on changed files
```

Checklist:

- [ ] Frontmatter valid (`title`, `description` where required)
- [ ] Internal links resolve (`/docs/guides/...`, not broken anchors)
- [ ] `$CodeSample` paths match existing example directories
- [ ] Admonitions, tabs, and partial includes render sensibly in PR preview
- [ ] No accidental whitespace-only or empty sections where components were removed
- [ ] Offered [`test-the-docs`](../test-the-docs/SKILL.md) for new/changed procedural snippets; Verification table present or credible `deferred` reasons recorded

Compare PR preview URL (from Vercel/deployment comment) against production for visual regressions when layout components are involved.

---

### Tutorial review

Tutorial MDX plus matching example app. **Read [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md)** for full platform E2E — review is not complete without it when auth flows are involved.

```bash
# MDX lint
cd apps/docs && pnpm lint:mdx -- content/guides/getting-started/tutorials/<path>

# Example build (from work-linear-issue)
cd examples/<example-dir>
npm install && npm run build
```

Checklist:

- [ ] MDX steps match example code after `pnpm codegen:examples` (if `$CodeSample` used)
- [ ] Env var names and Supabase client setup match current `@supabase/ssr` patterns
- [ ] Example pins catalog versions — no `"latest"` for in-repo packages
- [ ] Offered [`test-the-docs`](../test-the-docs/SKILL.md) for procedural tutorial steps (or `deferred` with reason)
- [ ] **Platform E2E** (when auth involved): SQL migration applied, auth flow walked, profiles verified — see `work-linear-issue` Phase 3

---

### Example review

Example-only PRs (or example portion of a tutorial PR).

```bash
cd examples/<example-dir>
npm install && npm run build
```

Checklist:

- [ ] Build passes with no type errors
- [ ] `.env.example` documents required vars (no secrets committed)
- [ ] If docs reference this example, `$CodeSample` paths still valid

---

### Studio review

Dashboard changes linking to docs.

Checklist:

- [ ] Links point to hosted docs anchors (e.g. `/guides/auth/auth-email-templates#terminology`)
- [ ] Local-dev-only doc paths not used as the sole link target
- [ ] Link text matches the destination section

---

### Component review

React component changes under `apps/docs/components/` without a new schema handler.

Checklist:

- [ ] No browser-only APIs leaked into build-script imports
- [ ] Shared constants extracted cleanly when also consumed by markdown handlers
- [ ] Visual behavior unchanged or intentionally improved — check PR screenshots
- [ ] If component is used in MDX exported to markdown, confirm a schema handler exists or file an follow-up

---

### Docs tooling review

Agent skills, contributor docs, or skill symlink wiring — no MDX/pipeline changes required.

Checklist:

- [ ] Symlinks under `.claude/skills/` and `.cursor/skills/` resolve to `.agents/skills/...` (same pattern as `vitest`)
- [ ] Cross-skill links resolve: relative for in-repo skills; absolute `docs-agent-skills` URLs only for skills that remain in that private repo
- [ ] No personal vault paths, Obsidian references, or private-process-only instructions
- [ ] `apps/docs/CONTRIBUTING.md` / `DEVELOPERS.md` pointers match skill names and checklist stages
- [ ] Reference files under a skill stay near the ~250-line guideline (split if bloated)

```bash
# Symlink smoke check
ls -la .claude/skills/<skill-name> .cursor/skills/<skill-name>
test -f .claude/skills/<skill-name>/SKILL.md

# Leftover internal refs
rg -n 'Obsidian|pm-the-docs-full|Priorities/' .agents/skills
```

---

## Phase 4 — Review report

One consolidated report after all PRs are reviewed.

### Report template

```markdown
# PR review report — <author, label, or topic>

Reviewed locally at `~/GitHub/supabase/supabase`.

**Stack order:** master → #NNN → … (if applicable)

---

## [#NNN — Title](https://github.com/supabase/supabase/pull/NNN)

**Type:** schema handler | pipeline | content | tutorial | example | studio | component | docs tooling | mixed

**Verdict:** Approve | Approve with nits | Request changes

| Check              | Result |
| ------------------ | ------ |
| PR type checks     | …      |
| Build / lint       | …      |
| Baseline vs master | …      |
| CI                 | …      |

**Verified:**

- …

**Notes:**

- …

---

## Summary

| PR   | Type | Recommendation | Blockers |
| ---- | ---- | -------------- | -------- |
| #NNN | …    | …              | …        |

**Merge order:** bottom-up after approval (if stacked).
```

### Verdict guidance

| Verdict               | When                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Approve**           | All type-specific checks pass; output correct                                        |
| **Approve with nits** | Works correctly; minor type/style/docs nits only                                     |
| **Request changes**   | Build/lint fails, broken links, wrong data, missing coverage, or failed platform E2E |

## Inline review comments

```text
https://github.com/supabase/supabase/pull/<number>/files#diff-<blob-sha>R<line>
```

```bash
gh api repos/supabase/supabase/pulls/<number>/files \
  --jq '.[] | select(.filename | endswith("<file>")) | .sha'
```

Include concrete evidence — JSON line numbers, before/after output snippets, failing command output.

## Handler pattern reference

```typescript
// apps/docs/internals/markdown-schema/Example.ts
import { withDocsBasePath } from '../internal-links'

export const Example = ({ props }: { props: Record<string, unknown> }): string => {
  // Same data source as React component → plain markdown string
}
```

## Parallel work

Independent PRs: subagents can review in separate worktrees. **Stacked** series: review sequentially on one clone, bottom-up.

## Output checklist

- [ ] Approval status fetched for all requested PRs
- [ ] Each PR classified by type
- [ ] Stack order documented (if applicable)
- [ ] Type-specific verification run locally (not just schema handler defaults)
- [ ] Master baseline compared when PR fixes missing output
- [ ] Platform E2E noted for tutorial/auth PRs (or deferred with reason)
- [ ] Verdict and blockers stated per PR
- [ ] Merge order recommended
- [ ] Inline comment links provided for nits
