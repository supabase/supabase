# Community Docs

`community-docs` is a proof-of-concept Next.js app that aggregates getting-started content from public repositories in the `supabase-community` GitHub organization.

The generated MDX files temporarily live in `apps/community-docs/content/<repo>/` until they can be moved to the supabase-community organization. The app reads those files, groups them by `category` frontmatter, and renders a searchable homepage plus one project page per resource.

## Local development

Install dependencies from the monorepo root:

```bash
pnpm install
```

Run the app:

```bash
pnpm --filter community-docs dev
```

By default, the app runs on port `3002` with a `/community-docs` base path.

## Fetch content

The content pipeline uses the GitHub CLI. Make sure `gh` is installed and authenticated:

```bash
gh auth status
```

Then run:

```bash
pnpm --filter community-docs fetch-content
```

The script lists public `supabase-community` repositories, fetches each README and markdown files under `/docs`, extracts sections headed `Getting Started`, `Quickstart`, `Installation`, or `Usage`, and writes one deterministic `.mdx` file per resource into `apps/community-docs/content/<repo>/`.

In CI, the workflow provides `GITHUB_TOKEN` for `gh` authentication.

## Generated frontmatter

Each generated file includes:

```yaml
title: Example Repo
description: Example description
repo: example-repo
repoUrl: https://github.com/supabase-community/example-repo
tags:
  - auth
category: Auth
```

For this proof of concept, metadata is inferred locally from the repo name, topics, description, and extracted content. There is no AI normalization step.

## Monorepo fit

This app follows the same conventions as `apps/docs`: Next.js App Router, shared Tailwind config from `config`, TypeScript config from `packages/tsconfig`, and UI primitives from `packages/ui`.
