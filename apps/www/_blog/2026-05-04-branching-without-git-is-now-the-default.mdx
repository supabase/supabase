---
title: 'Branching Without Git Is Now The Default'
description: 'Branching without Git is now the default for all Supabase projects.'
author: joshenlim, qiao, saxonf
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=horizontal&copy=Branching+Without+Git%0AIs+Now+The+Default&icon=icon-rows.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=vertical&copy=Branching+Without+Git%0AIs+Now+The+Default&icon=icon-rows.svg'
categories:
  - product
tags:
  - branching
  - postgres
  - database
date: '2026-05-04'
toc_depth: 2
---

Branching without Git is now the default for all Supabase projects.

Supabase has supported database branching through a git-based workflow since [Launch Week X](https://supabase.com/blog/supabase-branching). That workflow connects your GitHub repo to Supabase, tracks migrations in version control, and creates preview branches automatically when you open a pull request. It works well for teams that manage their database schema as code. But it requires a GitHub connection, which rules out anyone who doesn't work that way.

[Branching 2.0](https://supabase.com/blog/branching-2-0) removed that requirement. You create a branch from the dashboard, make changes using the SQL Editor or Table Editor, review a schema diff, and merge. No git configuration required. It shipped behind a feature preview. Today, that preview is gone.

Branching without Git is on by default for every project. It adds a second path for developers who want to iterate on their schema without setting up a Git integration. Both approaches are fully supported, and you can switch between them or use them together. If you're already using git-based branching, nothing changes.

## Two ways to branch

**Branching without Git**

Create branches directly from the Supabase Dashboard. Your branch gets its own Postgres instance with your current production schema. Make changes, preview the diff, and merge. The whole workflow stays inside Supabase.

Choose this when:

- You're prototyping schema changes and want fast iteration
- Your team manages the database primarily through the dashboard
- You're working with AI tools that create and manage branches programmatically
- You want to try branching without any upfront configuration

**Git-based branching**

Connect a GitHub repo to your Supabase project. Migrations live in version control. Branches are created automatically when you open a pull request and cleaned up when the PR is closed.

Choose this when:

- Your team already manages database migrations in git
- You want schema changes reviewed as part of your pull request workflow
- You need an audit trail of every migration in version control
- You prefer an infrastructure-as-code approach to database management

You can start with dashboard branching and add a git integration later when your workflow demands it. The two approaches use the same underlying infrastructure.

## How it works

**1. Create a branch**

Open your project in the Supabase Dashboard and click "Create Branch." Pick a name. Your branch spins up with your current production schema.

{/* TODO: replace with final screenshot */}
![Create a branch](/images/blog/branching-without-git-is-now-the-default/create-branch.png)

**2. Make changes**

Use the branch like any Supabase project. Add tables, modify columns, update RLS policies, change functions. Every schema change you make in the SQL Editor or Table Editor is tracked.

**3. Review the diff**

When you're ready to merge, Supabase generates a migration diff showing exactly what changed between your branch and production. This diff is powered by pg-delta, our new schema diffing engine.

{/* TODO: replace with final screenshot */}
![Review the diff](/images/blog/branching-without-git-is-now-the-default/review-diff.png)

**4. Merge**

Review the generated migration, confirm, and merge. Your schema changes are applied to production.

{/* TODO: replace with final screenshot */}
![Merge confirmation](/images/blog/branching-without-git-is-now-the-default/merge-confirmation.png)

## pg-delta: a new diffing engine

The merge experience depends on accurate schema diffs. We built pg-delta from scratch inside [pg-toolbelt](https://github.com/supabase/pg-toolbelt) to handle the full range of Postgres objects: tables, columns, RLS policies, functions, triggers, indexes, and extensions.

When you merge a branch, pg-delta compares the two schemas and generates the correct migration statements. It replaces migra as the default diffing engine for dashboard branching, with better coverage of Postgres-specific DDL.

pg-delta is also available in the Supabase CLI behind a flag for the `diff` command if you want to try it locally.

<Admonition type="note">

pg-delta is alpha software. If you discover any bugs related to diff review, please file a [GitHub issue](https://github.com/supabase/pg-toolbelt/issues) to help us improve the tooling.

</Admonition>

## Built for AI workflows

Every branch created through the Supabase MCP server uses dashboard branching automatically. When an AI tool needs to iterate on your database schema, it can create a branch, make changes, and merge, all without touching git. The branch exists for as long as the agent needs it and gets cleaned up when the work is done.

## Getting started

Branching is available now in your dashboard.

- [Dashboard](https://supabase.com/dashboard)
- [Branching documentation](https://supabase.com/docs/guides/deployment/branching)
- [pg-delta on GitHub](https://github.com/supabase/pg-toolbelt)

If you're using the git-based workflow today, nothing changes. Your existing setup continues to work. Dashboard branching is the new default for new projects and for users who haven't configured a git integration.
