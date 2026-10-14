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

## Quality sync to Supabase

A second script, `scripts/sync-repos-to-supabase.ts`, writes an append-only history of repo metadata and a computed quality score to Supabase Postgres. Content generation (`fetch-content`) stays untouched — the two pipelines are decoupled.

Copy `.env.example` to `.env.local` and set the Supabase env vars (prefer a Supabase branch of your project during testing). Then run:

```bash
pnpm --filter community-docs sync-repos
```

Each run inserts one row into `community_sync_runs`, upserts `community_repos`, and appends one row per repo to `community_repo_snapshots`. The authenticated dashboard reads from `latest_repo_metrics` and `quality_deltas_by_week` — see `supabase/migrations/`.

Human tier grades (`A`/`B`/`C`) live in `community_repo_grades` (editor role can update via SQL or a future UI).

## Quality dashboard Auth (dogfooding)

The public MDX site stays open. `/quality` requires a magic-link session for an allowlisted `@supabase.com` or `@supabase.io` email.

### Setup checklist

1. Create or link a Supabase project (prefer a branch).
2. Apply both migrations under `apps/community-docs/supabase/migrations/` (SQL editor or CLI).
3. Seed the allowlist:

```sql
insert into community_dashboard_allowlist (email, role)
values
  ('nik.richers@supabase.io', 'editor');
```

4. In Auth settings, enable the Email provider (magic link).
5. Configure Auth URLs for both local and Vercel demos (Studio → Authentication → URL configuration):
   - **Site URL**: your primary demo host (stable Vercel URL or production), e.g.  
     `https://community-docs-….vercel.app/community-docs`
   - **Redirect URLs** (add all that apply):
     - `http://localhost:3002/community-docs/**` (local)
     - `https://*-….vercel.app/community-docs/**` (Vercel preview wildcard for your team/project)
     - Exact preview URL if wildcards are restricted:  
       `https://<preview-host>/community-docs/**`
6. Copy `.env.example` → `.env.local` (and set the same `NEXT_PUBLIC_*` + service-role vars on the Vercel project):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon / publishable key)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (sync script / CI only)
7. Run `pnpm --filter community-docs sync-repos` when you need fresh metrics.
8. Local: `pnpm --filter community-docs dev` → `http://localhost:3002/community-docs/login`.  
   Demo: open the Vercel preview `/community-docs/login`, request a magic link, then `/quality`.

Magic links use the **current request origin**, so the same app works on localhost and on a Vercel preview as long as that origin is in the Auth redirect allow list.

Domain gate: only `@supabase.com` and `@supabase.io` emails can complete sign-in. Access also requires a matching row in `community_dashboard_allowlist`.

## Monorepo fit

This app follows the same conventions as `apps/docs`: Next.js App Router, shared Tailwind config from `config`, TypeScript config from `packages/tsconfig`, and UI primitives from `packages/ui`.
