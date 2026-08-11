---
name: review-the-docs
description: >-
  Review any open Supabase docs pull request locally in
  ~/GitHub/supabase/supabase — triage approval status, classify PR type,
  run type-specific verification (markdown pipeline, MDX content, tutorials,
  examples, Studio links), and produce a consolidated review report. Use when
  asked to review docs PRs, check who has approved, verify build output, or
  evaluate supabase/supabase documentation changes from any author.
---

# Review docs PRs

Local review workflow for **any** open `supabase/supabase` docs PR. Classify the PR first, then follow the matching checklist below.

For **implementing** docs fixes (Linear tickets, worktrees, platform E2E), use [`work-linear-issue`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/work-linear-issue/SKILL.md) instead.

## Core rules

1. **Classify before reviewing** — path patterns determine which checklist applies.
2. **Review stacked PRs bottom-up** — each PR may base on the previous branch.
3. **Run verification locally** — do not approve from diff alone.
4. **Compare against `master`** when the PR claims to fix missing or broken output.
5. **One report per batch** — sequential review, consolidated output at the end.
6. **Separate blockers from nits** — type/style notes are suggestions unless output breaks.

## Repository layout

| Path | Purpose |
|------|---------|
| `~/GitHub/supabase/supabase` | Main clone for review checkouts |
| `apps/docs/content/guides/` | Source MDX |
| `apps/docs/internals/` | Markdown pipeline (`generate-guides-markdown.ts`, etc.) |
| `apps/docs/internals/markdown-schema/` | Component handlers → plain markdown strings |
| `apps/docs/public/markdown/guides/` | Generated output (produced by build) |
| `apps/docs/components/` | React MDX components |
| `examples/` | Tutorial/quickstart apps referenced via `$CodeSample` |
| `apps/studio/` | Dashboard UI; may link to hosted docs |

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

| PR type | Path signals | Primary skill section |
|---------|--------------|----------------------|
| **Markdown-schema handler** | `apps/docs/internals/markdown-schema/`, `generate-guides-markdown.ts` | [Schema handler review](#schema-handler-review) |
| **Pipeline / internals** | `apps/docs/internals/` (not just one new handler) | [Pipeline review](#pipeline-review) |
| **Content-only MDX** | `apps/docs/content/**` only | [Content review](#content-review) |
| **Tutorial / quickstart** | `apps/docs/content/guides/**/tutorials/`, `quickstarts/`, plus `examples/` | [Tutorial review](#tutorial-review) → also `work-linear-issue` |
| **Example app only** | `examples/**` without matching MDX | [Example review](#example-review) |
| **Studio ↔ docs links** | `apps/studio/**` | [Studio review](#studio-review) |
| **Docs UI / components** | `apps/docs/components/`, `apps/docs/features/` (no pipeline) | [Component review](#component-review) |
| **Mixed** | Multiple path groups above | Run each applicable section; note overlap |

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

| Check | What to verify |
|-------|----------------|
| Data source | Same data/constants as the React component — no duplicated config |
| CJS interop | `shared-data` via `createRequire(import.meta.url)` (see `SharedData.ts`) |
| Local JSON | Direct imports fine for `apps/docs/data/` |
| Link prefix | Links use `withDocsBasePath` |
| SCHEMA wiring | Registered in `SCHEMA` in `generate-guides-markdown.ts` |
| Props / shapes | All MDX usages covered — flat arrays and `{ items: [...] }` sections |
| Silent fallbacks | `''` for unknown props OK if consistent with existing handlers |

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

## Phase 4 — Review report

One consolidated report after all PRs are reviewed.

### Report template

```markdown
# PR review report — <author, label, or topic>

Reviewed locally at `~/GitHub/supabase/supabase`.

**Stack order:** master → #NNN → … (if applicable)

---

## [#NNN — Title](https://github.com/supabase/supabase/pull/NNN)

**Type:** schema handler | pipeline | content | tutorial | example | studio | component | mixed

**Verdict:** Approve | Approve with nits | Request changes

| Check | Result |
|-------|--------|
| PR type checks | … |
| Build / lint | … |
| Baseline vs master | … |
| CI | … |

**Verified:**
- …

**Notes:**
- …

---

## Summary

| PR | Type | Recommendation | Blockers |
|----|------|----------------|----------|
| #NNN | … | … | … |

**Merge order:** bottom-up after approval (if stacked).
```

### Verdict guidance

| Verdict | When |
|---------|------|
| **Approve** | All type-specific checks pass; output correct |
| **Approve with nits** | Works correctly; minor type/style/docs nits only |
| **Request changes** | Build/lint fails, broken links, wrong data, missing coverage, or failed platform E2E |

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
