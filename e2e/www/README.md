# WWW E2E tests

This guide explains how to run Playwright end-to-end checks against marketing
site content pages.

Use this suite when you change blog posts, events, customer stories, or
alternatives pages under `apps/www`. It loads each in-scope page, checks that it
returns a successful status, and scans it for accessibility violations.

This page covers:

- [Set up](#set-up) — install the browser once
- [Run the tests](#run-the-tests) — the usual local command
- [Choose a target URL](#choose-a-target-url) — production, preview, or local www
- [Override which pages run](#override-which-pages-run) — when the default git
  scope is wrong
- [What the suite covers](#what-the-suite-covers) — in-scope paths and limits
- [Accessibility scans](#accessibility-scans) — WCAG coverage and warn mode
- [Global element scans](#global-element-scans) — nav, footer, and page scaffolding
- [Debug failures](#debug-failures) — reports and traces
- [How CI uses this suite](#how-ci-uses-this-suite) — pull request behavior

## Set up

1. From this directory, install the Playwright Chromium browser once:

   ```bash
   cd e2e/www
   pnpm exec playwright install chromium
   ```

## Run the tests

By default, `pnpm e2e:www` tests pages affected by your current changes: commits
since `origin/master`, plus staged and unstaged working-tree files. If nothing
in scope changed, the command exits successfully without starting Playwright.

1. From the repository root, point the suite at a deployed site and run it:

   ```bash
   PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www
   ```

Extra arguments pass through to Playwright, so `pnpm e2e:www --ui` opens UI mode
and `pnpm e2e:www --grep @a11y` runs only the accessibility assertions.

### Run every in-scope page

To test every content page instead of a changed-files scope — for example, a
periodic full-site check — run:

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www:all
```

This ignores `WWW_E2E_PAGE_PATHS` and the 20-page cap described in
[Limits](#limits), and tests every page across all four content directories —
around 480 as of this writing. `--all` runs also default to
`--max-failures=0`, so a full run isn't cut short by `playwright.config.ts`'s
global `maxFailures: 3`. The suite runs one worker by default, so pass
`--workers` to parallelize it:

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www:all -- --workers=4
```

Against production, raising workers does not pay off: a serial full run finishes
in about 17 minutes with no failures, while four workers took longer and timed
out on 34 of 480 navigations. Those timeouts are load, not page defects. Prefer
the default single worker unless you are pointed at a preview or a local server.

## Choose a target URL

Tests use `PLAYWRIGHT_BASE_URL`. When unset, they default to the local www dev
server at `http://localhost:3000`.

Prefer a deployed site for day-to-day checks. Use the local server only when you
need unpublished content that production does not serve yet.

For a protected Vercel preview, also set `VERCEL_AUTOMATION_BYPASS_SECRET`.

To use the local server, start it with `pnpm dev:www` from the repository root
and run the suite without `PLAYWRIGHT_BASE_URL`.

## Override which pages run

Leave `WWW_E2E_PAGE_PATHS` unset to keep the default changed-files scope.

To test specific pages instead of the git diff:

```bash
WWW_E2E_PAGE_PATHS=/blog/supabase-steve-chavez \
  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www
```

`WWW_E2E_PAGE_PATHS` accepts a comma- or newline-separated list of
site-relative paths. `WWW_E2E_BASE_REF` overrides the base ref the git diff
compares against.

## What the suite covers

### In scope

| Changed path                   | Behavior                    |
| ------------------------------ | --------------------------- |
| `apps/www/_blog/*.mdx`         | Test `/blog/<slug>`         |
| `apps/www/_events/*.mdx`       | Test `/events/<slug>`       |
| `apps/www/_customers/*.mdx`    | Test `/customers/<slug>`    |
| `apps/www/_alternatives/*.mdx` | Test `/alternatives/<slug>` |

Slugs come from the filename, matching `getAllPostSlugs` in
`apps/www/lib/posts.tsx`. Blog and event filenames drop their `YYYY-MM-DD-`
prefix; customers and alternatives use the filename as-is.

Each page gets one test: it must return a successful status, and an axe scan must
report no `page-has-heading-one` violations. That rule passes on all four
templates today, so enforcing it catches a new violation without failing on
existing debt.

It runs against the page landmark rather than the article, since every template
renders its `<h1>` outside the article wrapper. `heading-order` runs against the
article and is reported only: the alternatives template already violates it, so
enforcing it would fail every alternatives pull request.

### Out of scope

- Events with `disable_page_build: true`, which return a 404 by design
- Static marketing routes under `apps/www/pages` and `apps/www/app`
- Index and listing pages such as `/blog` and `/customers`, for the page suite.
  The global-element suite covers them.
- Link checking

Shared chrome — the nav, the footer, and everything else outside the article
wrapper — belongs to the global-element suite described in
[Global element scans](#global-element-scans).

### Limits

Resolved scope is capped at 20 pages so a large content drop cannot explode
runtime. If a change resolves to more pages than that, only the first 20 in
sorted order are tested. To test beyond the cap, use `pnpm e2e:www:all` or set
`WWW_E2E_PAGE_PATHS` explicitly.

## Accessibility scans

The `@a11y`-tagged test scans each in-scope page for WCAG 2.1 A/AA violations, limited
to the article wrapper for that template.

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www:a11y
```

**Warn mode.** Only `ENFORCED_RULES` in `utils/axe-helpers.ts` fails the build, and it
holds rules that pass today, so it cannot fail on existing debt. Everything else lands
as a warning annotation and in the run's `axe-results.json` attachment. Set
`A11Y_ENFORCE_ALL=1` to make every finding blocking for a local triage run.

**Scan your own preview.** The page list comes from your branch, but the content comes
from whatever `PLAYWRIGHT_BASE_URL` points at. Production 404s on a page you just
added.

**Configuration:** article selectors per template live in `utils/www-selectors.ts`,
rule lists in `utils/axe-helpers.ts`.

## Global element scans

Global elements are everything outside the article: the nav, the footer, and the rest
of the page scaffolding.

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www:global-elements
```

**Why this is a separate suite:**

- **Attribution.** Global markup renders on every page. Scanning it alongside changed
  content would report the footer's heading skip on a pull request that only edited an
  `.mdx` file. That skip is on nearly every www page.
- **Scope.** These elements don't vary by page, so the scope is a fixed list of one page
  per layout rather than the changed-files scope the page scan uses. Each element is
  scanned once instead of once per changed page.

The two suites are separate Playwright projects, so a content pull request never runs
this one. Its report lands in `playwright-report-global-elements/`.

**Point it at your preview, not production,** when you change global elements. The
`data-testid` hooks it looks for only exist on branches that carry them.

**Configuration:** the page list, the element list, and which elements to expect at
each viewport live in `utils/www-global-elements.ts`. Rule lists are in
`utils/axe-helpers.ts`.

## Debug failures

1. Open the HTML report after a run:

   ```bash
   pnpm -C e2e/www exec playwright show-report
   ```

2. Inspect traces and screenshots under `test-results/` for failed runs. The
   global-element suite writes to `test-results-global-elements/` and
   `playwright-report-global-elements/` instead, so the two runs never overwrite
   each other's output.

## How CI uses this suite

The workflow at `.github/workflows/www-e2e.yml` runs both suites in one job, each
behind its own paths filter.

The page suite runs on pull requests that touch owned www content, `e2e/www`, or
`e2e/shared`.

1. Diff the pull request against its base branch and resolve in-scope page paths.
2. Skip Playwright when nothing in scope changed.
3. When `apps/www` changed, wait for the Vercel www preview and set
   `PLAYWRIGHT_BASE_URL` to that preview. When no preview resolves, skip rather
   than test against production, which does not have pages the pull request adds.
4. Run the suite with `WWW_E2E_PAGE_PATHS` set to the resolved list.

The global-element suite runs on pull requests that touch `apps/www/components`,
`apps/www/layouts`, the app shell, or the harness. A content-only pull request
never reaches it.

1. Reuse the same preview when one resolved.
2. Fall back to production when no preview resolved and the pull request changes
   no `apps/www` files. A harness-only change ships no markup, so production is
   the same surface.
3. Skip when no preview resolved and the pull request does change `apps/www`,
   because production would not have those chrome changes.

Draft pull requests stay skipped until you mark them ready for review. Manual
`workflow_dispatch` runs accept an optional `base_url`, which defaults to
production, and require a `page_paths` input for the page suite only.

## Shared helpers

`e2e/shared` holds the pieces this suite and `e2e/docs` both use: git diff
collection, page-path parsing, the runner, and the scope-resolver CLI. Suite
directories keep only what is specific to them — for www, that is the
content-file-to-URL mapping in `utils/resolve-www-scope.ts`.
