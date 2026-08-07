# WWW E2E tests

This guide explains how to run Playwright end-to-end checks against marketing
site content pages.

Use this suite when you change blog posts, events, customer stories, or
alternatives pages under `apps/www`. It loads each in-scope page, checks that it
returns a successful status, and scans it for a single accessibility rule.

This page covers:

- [Set up](#set-up) — install the browser once
- [Run the tests](#run-the-tests) — the usual local command
- [Choose a target URL](#choose-a-target-url) — production, preview, or local www
- [Override which pages run](#override-which-pages-run) — when the default git
  scope is wrong
- [What the suite covers](#what-the-suite-covers) — in-scope paths and limits
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
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:www:all -- --workers=6
```

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

Each page gets one test: it must return a successful status, and an axe scan
must report no `page-has-heading-one` violations. That is the only rule enforced
today — add more in `features/www-pages.spec.ts` once a class of issue reaches
zero across the site.

### Out of scope

- Events with `disable_page_build: true`, which return a 404 by design
- Static marketing routes under `apps/www/pages` and `apps/www/app`
- Index and listing pages such as `/blog` and `/customers`
- Link checking, and every accessibility rule other than the one above

### Limits

Resolved scope is capped at 20 pages so a large content drop cannot explode
runtime. If a change resolves to more pages than that, only the first 20 in
sorted order are tested. To test beyond the cap, use `pnpm e2e:www:all` or set
`WWW_E2E_PAGE_PATHS` explicitly.

## Debug failures

1. Open the HTML report after a run:

   ```bash
   pnpm -C e2e/www exec playwright show-report
   ```

2. Inspect traces and screenshots under `test-results/` for failed runs.

## How CI uses this suite

The workflow at `.github/workflows/www-e2e.yml` runs on pull requests that touch
owned www content, `e2e/www`, or `e2e/shared`.

1. Diff the pull request against its base branch and resolve in-scope page paths.
2. Skip Playwright when nothing in scope changed.
3. When `apps/www` changed, wait for the Vercel www preview and set
   `PLAYWRIGHT_BASE_URL` to that preview. When no preview resolves, skip rather
   than test against production, which does not have pages the pull request adds.
4. Run the suite with `WWW_E2E_PAGE_PATHS` set to the resolved list.

Draft pull requests stay skipped until you mark them ready for review. Manual
`workflow_dispatch` runs require a `page_paths` input and accept an optional
`base_url`, which defaults to production.

## Shared helpers

`e2e/shared` holds the pieces this suite and `e2e/docs` both use: git diff
collection, page-path parsing, the runner, and the scope-resolver CLI. Suite
directories keep only what is specific to them — for www, that is the
content-file-to-URL mapping in `utils/resolve-www-scope.ts`.
