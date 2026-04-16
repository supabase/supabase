---
title: 'Introducing: Postgres Best Practices'
description: 'We are releasing Agent Skills for Postgres Best Practices to help AI coding agents write high quality, correct Postgres code.'
author: pedro_rodrigues
imgSocial: 2026-01-21-postgres-best-practices-for-ai-agents/og.png
imgThumb: 2026-01-21-postgres-best-practices-for-ai-agents/thumb.png
categories:
  - developers
tags:
  - ai
  - postgres
  - skills
date: '2026-01-21'
toc_depth: 2
---

We are releasing a series of Agent Skills for [Postgres Best Practices](https://github.com/supabase/agent-skills) to teach AI agents how to write better Postgres code. AI coding agents are good at writing code. They struggle with writing _correct_ code for systems they don't understand.

Postgres is one of those systems. It has decades of features, edge cases, and performance characteristics that matter in production. An agent might generate a query that works but creates a full table scan. It might suggest an index that makes writes slower. It might miss Row Level Security entirely.

The Agent Skills we’re releasing today will help guide your coding agent of choice to generate high quality, correct code.

## What's in the repo

The repository contains rules across 8 categories, prioritized by impact:

- **Query Performance (Critical):** Rules for writing efficient queries and avoiding full table scans
- **Connection Management (Critical):** Connection pooling, client lifecycle, and resource limits
- **Security and RLS (Critical):** Row Level Security policies and access control patterns
- **Schema Design (High):** Table structure, data types, and normalization decisions
- **Concurrency and Locking (Medium-High):** Transaction isolation, deadlock prevention, and lock management
- **Data Access Patterns (Medium):** Pagination, bulk operations, and query design
- **Monitoring and Diagnostics (Low-Medium):** Query analysis, performance tracking, and debugging
- **Advanced Features (Low):** Postgres-specific capabilities like CTEs, window functions, and extensions

Each rule follows a consistent format. Here is an example for configuring Row Level Security:

````markdown
---
title: Enable Row Level Security for Multi-Tenant Data
impact: MEDIUM-HIGH
impactDescription: Database-enforced tenant isolation, prevent data leaks
tags: rls, row-level-security, multi-tenant, security
---

## Enable Row Level Security for Multi-Tenant Data

Row Level Security (RLS) enforces data access at the database level, ensuring users only see their own data.

**Incorrect (application-level filtering only):**

```sql
-- Relying only on application to filter
select *
from orders
where user_id = $current_user_id;

-- Bug or bypass means all data is exposed!
-- Returns ALL orders:
select *
from orders;
```

**Correct (database-enforced RLS):**

```sql
-- Enable RLS on the table
alter table orders
enable row level security;

-- Create policy for users to see only their orders
create policy orders_user_policy on orders
  for all
  using (
    user_id = current_setting('app.current_user_id')::bigint
  );

-- Force RLS even for table owners
alter table orders
force row level security;

-- Set user context and query
set app.current_user_id = '123';
select * from orders;  -- Only returns orders for user 123
```

Policy for authenticated role:

```sql
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = auth.uid());
```

Reference: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
````

## How agents use these rules

This repo follows the [Agent Skills](https://agentskills.io) format, an open standard for giving agents domain expertise. The format works with Claude Code, Cursor, GitHub Copilot, VS Code, Gemini CLI, and other tools.

Agent Skills are folders of instructions and examples that agents can discover and use on demand. Think of them as documentation written for machines. Instead of hoping an agent learned the right patterns from its training data, you give it explicit rules to follow. The agent reads the skill when it needs guidance and applies the rules to its work.

The format was developed by [Anthropic](https://github.com/anthropics/skills) and released as an open standard. It has since been adopted across the industry. Vercel used it to publish [react-best-practices](https://vercel.com/blog/introducing-react-best-practices), packaging ten years of React and Next.js optimization knowledge into 40 rules that agents can reference. Cloudflare released [skills for Workers, Pages, D1, R2, and 40 other services](https://github.com/cloudflare/skills). We're applying the same approach to Postgres.

When you install the skill, your agent gains access to all 30 rules. It can reference them when writing queries, reviewing code, or suggesting schema changes. The agent treats the rules as authoritative guidance rather than generating advice from its training data.

## Why we built this

Supabase runs Postgres for hundreds of thousands of projects. We see the same mistakes repeatedly:

- Missing indexes on foreign keys
- Queries that bypass RLS by accident
- Migrations that lock tables in production
- Connection pool exhaustion from poorly managed clients
- Full table scans hidden behind ORMs

Our support team, database advisors, and documentation already contain this knowledge. We packaged it into a format that agents can use directly.

## How this fits with the Supabase MCP server

If you've used the [Supabase MCP server](https://supabase.com/docs/guides/getting-started/mcp), you know it lets AI agents connect directly to your Supabase project. Agents can create tables, run queries, manage schemas, and configure settings through natural language.

The MCP server gives agents the _ability_ to work with your database. These best practices teach them to do it _correctly_.

Think of it this way: the MCP server is the steering wheel, and the best practices are the driving lessons. An agent with MCP access can execute any query you ask for. An agent with both MCP access and these rules will warn you before creating an index that locks your table, suggest RLS policies before you ship insecure code, and structure queries to avoid performance problems.

They work well together. The MCP server handles the connection and execution. The best practices handle the judgment.

## Contributing

The rules in this repo came from our internal knowledge base, but we know the community has insights we've missed.

If you've hit a Postgres gotcha that agents should know about, open a PR. Each rule needs:

- A clear title
- A priority level (critical, high, medium, low)
- An explanation of why it matters
- Good and bad code examples

The `CONTRIBUTING.md` file has the full template.

## Get started

The repo is live at [github.com/supabase/agent-skills](https://github.com/supabase/agent-skills).

To install a skill, you can use [Vercel’s skills npm package](https://www.npmjs.com/package/skills) to interactively install this skill on your agent.

```
npx skills add supabase/agent-skills
```

If you’re using Claude Code, you can also install this skill as a plugin.

```
/plugin marketplace add supabase/agent-skills
/plugin install postgres-best-practices@supabase-agent-skills
```

Try it on your next Postgres project, and let us know what rules are missing.
