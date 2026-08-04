# Docs E2E tests

This guide explains how to run Playwright end-to-end checks against docs pages
this repo owns.

Use this suite when you change guides, troubleshooting entries, or shared
partials under `apps/docs/content`. It loads each in-scope page, checks that the
article renders, and verifies that docs-owned links in the article resolve.

This page covers:

- [Set up](#set-up) — install the browser once
- [Run the tests](#run-the-tests) — the usual local command
- [Choose a target URL](#choose-a-target-url) — production, preview, or local docs
- [Override which pages run](#override-which-pages-run) — when the default git
  scope is wrong
- [What the suite covers](#what-the-suite-covers) — in-scope paths and limits
- [Accessibility scans](#accessibility-scans) — WCAG rules, scan modes, and
  reports
- [Debug failures](#debug-failures) — reports and traces
- [How CI uses this suite](#how-ci-uses-this-suite) — pull request behavior

## Set up

1. From this directory, install the Playwright Chromium browser once:

   ```bash
   cd e2e/docs
   pnpm exec playwright install chromium
   ```

## Run the tests

By default, `pnpm e2e:docs` tests pages affected by your current changes:
commits since `origin/master`, plus staged and unstaged working-tree files. If
nothing in scope changed, the command exits successfully without starting
Playwright.

1. From the repository root, point the suite at a deployed docs site and run it:

   ```bash
   PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs
   ```

2. Optional: open Playwright UI mode for the same scoped run:

   ```bash
   PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:ui
   ```

You can also run from `e2e/docs` with `pnpm run e2e:docs`.

## Choose a target URL

Tests use `PLAYWRIGHT_BASE_URL`. When unset, they default to the local docs
dev server at `http://localhost:3001`.

Prefer a deployed site for day-to-day checks. Use the local server only when you
need unpublished content that production does not serve yet.

### Deployed site

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs
```

For a protected Vercel preview, also set `VERCEL_AUTOMATION_BYPASS_SECRET`.

### Local docs server

1. From the repository root, start docs in a separate terminal:

   ```bash
   pnpm dev:docs
   ```

2. Run the suite without `PLAYWRIGHT_BASE_URL`, or set it to
   `http://localhost:3001`.

The local server needs a full monorepo install and credentials for some content.

Local runs are unreliable for pages whose docs-owned links point into
`/docs/reference/*` or `/docs/guides/auth/server-side/*`: reference pages can
take over a minute to compile on first request in dev mode, which exceeds the
suite's per-test timeout, and `server-side` auth guides have a known local-only
routing issue that 404s even though the page serves correctly in production.
Prefer a deployed site for pages that link into either of those sections.

## Override which pages run

Leave `DOCS_E2E_PAGE_PATHS` unset to keep the default changed-files scope.

To test specific pages instead of the git diff:

```bash
DOCS_E2E_PAGE_PATHS=/docs/guides/getting-started/quickstarts/nextjs \
  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs
```

To compare against a different base ref:

```bash
DOCS_E2E_BASE_REF=origin/develop \
  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs
```

`DOCS_E2E_PAGE_PATHS` accepts a comma- or newline-separated list of `/docs/...`
paths.

### Run every in-scope page

To test every guide and troubleshooting entry instead of a changed-files scope
— for example, a periodic full-site check — run:

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:all
```

This ignores `DOCS_E2E_PAGE_PATHS` and the 20-page cap described in
[Limits](#limits), and tests every page listed by
`pnpm -C e2e/docs resolve-docs-scope` across the whole `guides` and
`troubleshooting` trees — several hundred pages as of this writing. `--all`
runs also default to `--max-failures=0`, so a full run isn't cut short by
`playwright.config.ts`'s global `maxFailures: 3`. Expect a long run: the suite
runs one worker by default, so pass `--workers` to parallelize it, for
example:

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:all -- --workers=4
```

Run this against a deployed site, not the local dev server — see
[Local docs server](#local-docs-server) for why local runs are unreliable for
pages linking into reference docs or server-side auth guides.

## What the suite covers

### In scope

| Changed path                                 | Behavior                                                 |
| -------------------------------------------- | -------------------------------------------------------- |
| `apps/docs/content/guides/**/*.mdx`          | Test `/docs/guides/<slug>`, excluding federated sections |
| `apps/docs/content/troubleshooting/**/*.mdx` | Test `/docs/guides/troubleshooting/<slug>`               |
| `apps/docs/content/_partials/**`             | Test owned pages that include that partial               |

### Out of scope

- Federated guide sections: `graphql`, `database/extensions/wrappers`,
  `ai/python`, `deployment/terraform`, `deployment/ci`
- Reference docs under `/docs/reference`
- Non-docs routes such as `/dashboard` and `/ui`, which the link checker skips

### Limits

Resolved scope is capped at 20 pages so a widely shared partial cannot explode
runtime. If a change resolves to more pages than that, only the first 20 in
sorted order are tested and the rest are silently dropped from that run. To
test beyond the cap, use `pnpm e2e:docs:all` instead of raising it. See
[Run every in-scope page](#run-every-in-scope-page).

To inspect the resolved list without running Playwright, replicate the same
scope `pnpm e2e:docs` uses by default: commits since `origin/master`, plus
staged and unstaged working-tree changes.

```bash
{
  git diff --name-only --diff-filter=ACMR origin/master...HEAD
  git diff --name-only --diff-filter=ACMR
  git diff --name-only --diff-filter=ACMR --cached
} | pnpm -C e2e/docs resolve-docs-scope
```

## Accessibility scans

The `@a11y`-tagged test scans each in-scope page for WCAG 2.1 A/AA violations
using `@axe-core/playwright`, limited to the main article.

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:a11y
```

### Which rules fail

Only `heading-order` and `page-has-heading-one` fail a run. Both reached zero
across the whole site, so the check guards that. Every other rule reports without
failing, because the site still carries a backlog that would otherwise block
every pull request.

As a class of issue reaches zero, add its rule to `ENFORCED_RULES` in
`utils/axe-helpers.ts` so it can't come back. To preview what failing on
everything would look like:

```bash
A11Y_ENFORCE_ALL=1 PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:a11y
```

### Excluded rules

`LEAN_EXCLUDED_RULES` in `utils/axe-helpers.ts` skips `color-contrast` and eight
document-level rules, roughly halving scan time on a large page.

`color-contrast` accounts for most of that time and finds nothing inside an
article — docs contrast issues come from shared design tokens and site chrome,
which a content change can neither introduce nor fix. The document-level rules
target `<html>`, `<head>`, and `<body>`, so they can't fire when the scan is
limited to an article.

Cross-origin frames are skipped too. Without that, embedded YouTube players get
scanned and YouTube's own markup is reported as ours; on a page with one embed
that accounted for 11 of 15 violations. `frame-title` still fires, because the
`<iframe>` docs renders lives in our own document.

### How findings are reported

Violations appear in the Playwright output, and the full axe result for each page
is attached to the HTML report as `axe-results.json`.

Results record whether each page actually loaded, so a 404 is reported as a
failed load rather than as a clean page or an accessibility failure. A scan that
sees implausibly few elements fails outright instead of reporting a false pass —
that catches scanning before a page finishes rendering.

### Exhaustive triage harness (temporary)

> [!NOTE]
> The exhaustive scan is throwaway tooling for producing a one-off triage report,
> and is not intended to ship. Only the per-page check above is permanent.

`pnpm e2e:docs:a11y:all` scans every guide and troubleshooting page, plus the
shared chrome the per-page check can't reach: the command menu, the mobile
navigation drawer, and the feedback widget. It differs from the per-page check in
three ways — whole pages rather than articles, the complete rule set rather than
the lean one, and nothing fails.

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:a11y:all -- --workers=6
```

Expect around 10 minutes at six workers against a deployed site. Each surface
writes one JSON file to `a11y-results/`, so an interrupted run is resumable by
re-running only what's missing.

Summarize a completed run:

```bash
pnpm e2e:docs:a11y:summarize
```

That writes `a11y-report/summary.md` and `summary.json`, grouping findings by rule
and by docs area, then deduplicating: contrast collapses by color pair, so one bad
token counts once, and everything else collapses by element shape, so a shared
component failing on hundreds of pages counts once with a tally of where it
appears. Because per-page and exhaustive runs measure different things, the
summarizer refuses to combine them — clear `a11y-results/` between modes.

`a11y-results/` and `a11y-report/` are both ignored by Git. Reports are published
to Notion, not committed.

### Known gaps

- `/docs/reference/*` isn't scanned, matching the rest of this suite. Those
  routes render client-side into tens of thousands of elements, where axe exceeds
  its timeout and results depend on whether the scan caught the page mid-render.
- Shared chrome — nav, sidebar, footer, menus, and drawers — is outside the
  article scope and isn't covered here.
- axe catches roughly 30-40% of WCAG issues. Keyboard navigation, focus
  management, and screen reader behavior still need manual testing.

## Debug failures

1. Open the HTML report after a run:

   ```bash
   pnpm -C e2e/docs exec playwright show-report
   ```

2. Inspect traces and screenshots under `test-results/` for failed runs.

## How CI uses this suite

The workflow at `.github/workflows/docs-e2e.yml` runs on pull requests that touch
owned docs content, partials, or `e2e/docs`.

1. Diff the pull request against its base branch and resolve in-scope page paths.
2. Skip Playwright when nothing in scope changed.
3. When `apps/docs` changed, wait for the Vercel docs preview and set
   `PLAYWRIGHT_BASE_URL` to that preview. Otherwise use production.
4. Run the suite with `DOCS_E2E_PAGE_PATHS` set to the resolved list.

Accessibility findings other than the two failing rules don't fail the job; read
them in the Playwright output, or from the `axe-results.json` attachment in the
report artifact.

Draft pull requests stay skipped until you mark them ready for review. Manual
`workflow_dispatch` runs require a `page_paths` input and accept an optional
`base_url`, which defaults to production.
