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
- [Accessibility scans](#accessibility-scans) — WCAG coverage and skipped rules
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

The `@a11y`-tagged test scans each in-scope page for WCAG 2.1 A/AA violations using
`@axe-core/playwright`, limited to the main article.

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:a11y
```

Which pages get scanned comes from your branch, but the content comes from
whatever you point `PLAYWRIGHT_BASE_URL` at. Production won't have your edits and
will 404 on a page you just added, so use your pull request's preview to scan your
own content.

`EXCLUDED_RULES` in `utils/axe-helpers.ts` lists the rules the scan skips.
`color-contrast` is most of the scan time and finds nothing inside an article, since
docs contrast comes from shared tokens and chrome. The rest target `<html>`, `<head>`,
and `<body>`, which an article-scoped scan can't reach.

Cross-origin frames are skipped, so a third-party embed isn't reported as ours.

Not covered: `/docs/reference/*`, shared chrome, and most of WCAG. Keyboard
navigation, focus management, and screen reader behavior need manual testing.

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
   `PLAYWRIGHT_BASE_URL` to that preview. When no preview resolves, skip rather than
   test against production.
4. Run the suite with `DOCS_E2E_PAGE_PATHS` set to the resolved list.

Draft pull requests stay skipped until you mark them ready for review. Manual
`workflow_dispatch` runs require a `page_paths` input and accept an optional
`base_url`, which defaults to production.
