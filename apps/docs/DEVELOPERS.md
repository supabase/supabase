# Developing Supabase Docs

## Getting started

Thanks for your interest in [Supabase docs](https://supabase.com/docs) and for wanting to contribute! Before you begin, read the
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md) and check out the
[existing issues](https://github.com/supabase/supabase/issues).
This document describes how to set up your development environment to contribute to [Supabase docs](https://supabase.com/docs).

For a complete run-down on how all of our tools work together, see the main DEVELOPERS.md. That readme describes how to get set up locally in lots of detail, including minimum requirements, our Turborepo setup, installing packages, sharing components across projects, and more. This readme deals specifically with the docs site.

> [!TIP]
> If you work at Supabase, branch this repo directly to make PRs. Don't use a fork. This lets the CI checks auto-run and speeds up review.

## Local setup

[supabase.com/docs](https://supabase.com/docs) is a Next.js site. You can get setup by following the same steps for all of our other Next.js projects:

1. Follow the steps outlined in the Local Development section of the main [DEVELOPERS.md](https://github.com/supabase/supabase/blob/master/DEVELOPERS.md)
2. If you work at Supabase, from `apps/docs` run `pnpm run dev:secrets:pull` to write internal env vars to `.env.local`. If you're a community member, create `apps/docs/.env.local` and add this line: `NEXT_PUBLIC_IS_PLATFORM=false`
3. Start the local docs site by navigating to `/apps/docs` and running `pnpm run dev`
4. Visit http://localhost:3001/docs in your browser - don't forget to append the `/docs` to the end
5. Your local site should look exactly like [https://supabase.com/docs](https://supabase.com/docs)

## AI friendly documentation

This project generates Markdown files for each page under `/docs/guides/..` path.

To test locally, within the `apps/docs` directory:

1. Run `pnpm build:guides-markdown`
2. Run `pnpm dev`

This creates Markdown files for all routes under the `public/markdown/guides` directory, ignored by Git.

For production this setup runs as a `prebuild` task to allow Vercel to bundle these files with middleware and functions.

## Accessibility checks

Docs pages are scanned for WCAG 2.1 A/AA issues with axe-core, as part of the
Playwright suite in `e2e/docs`. Pull requests scan the pages your change affects,
limited to the main article.

To scan the pages your current branch changes:

```bash
PLAYWRIGHT_BASE_URL=https://supabase.com pnpm e2e:docs:a11y
```

That resolves which pages to scan from your branch, but reads them from
production, so it won't see your edits and will 404 on a page you just added.
Point `PLAYWRIGHT_BASE_URL` at your pull request's preview to scan your own
content.

See [`e2e/docs/README.md`](https://github.com/supabase/supabase/blob/master/e2e/docs/README.md)
for coverage and skipped rules.

## Contributing

For repo organization and style guide, see the [contributing guide](https://github.com/supabase/supabase/blob/master/apps/docs/CONTRIBUTING.md).
