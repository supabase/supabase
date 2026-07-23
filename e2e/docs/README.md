# Supabase Docs E2E Tests

Playwright end-to-end tests for the docs site under `apps/docs`.
Add new docs journeys under `features/`. They all run together as one suite.

## Setup

Install the Playwright browser once from this directory:

```bash
cd e2e/docs
pnpm exec playwright install chromium
```

## Choosing a target URL

Tests run against whatever `PLAYWRIGHT_BASE_URL` points to, defaulting to the
local docs dev server at `http://localhost:3001`.

- **Local docs server** — in a separate terminal, start docs from the repo root:

  ```bash
  pnpm dev:docs
  ```

- **A deployed site** — set the base URL inline:

  ```bash
  PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs
  ```

If the target is a protected Vercel preview, also set
`VERCEL_AUTOMATION_BYPASS_SECRET` so the tests can bypass deployment protection.

The local docs server requires a full monorepo install and credentials for some
content, so the quickest way to run the suite is against a deployed site. Reach
for the local server only when you need to test unpublished content changes.

## Running the tests

From the repo root:

```bash
pnpm e2e:docs
```

Or from this directory:

```bash
pnpm run e2e:docs
```

### UI mode for debugging

```bash
pnpm e2e:docs:ui
```

### Run a single file

```bash
pnpm run e2e:docs -- features/<name>.spec.ts
```

## Debugging

- View the HTML report after a run:

  ```bash
  pnpm -C e2e/docs exec playwright show-report
  ```

- Traces and screenshots for failures are saved in `test-results/`.

## CI

`.github/workflows/docs-e2e.yml` runs this suite on pull requests that touch the
tested docs pages or `e2e/docs`. When the PR changes `apps/docs`, the workflow
waits for the matching Vercel preview and points `PLAYWRIGHT_BASE_URL` at it.
When only the harness or workflow changes, Vercel skips the docs preview, so
the suite falls back to production. Draft PRs are skipped until marked ready
for review. The workflow can also be triggered manually with an optional
`base_url` input that defaults to production.
