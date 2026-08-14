---
title: "AI Agents Know About Supabase. They Don't Always Use It Right."
description: 'Introducing Supabase Agent Skills: an open-source set of instructions that teach AI coding agents how to build on Supabase correctly.'
author: pedro_rodrigues
imgSocial: 2026-04-07-supabase-agent-skills/og.png
imgThumb: 2026-04-07-supabase-agent-skills/thumb.png
categories:
  - product
tags:
  - ai
  - skills
  - security
  - postgres
date: '2026-04-09'
toc_depth: 2
---

Today we're releasing Supabase Agent Skills, an open-source set of instructions that teach AI coding agents how to build on Supabase correctly. If you use Claude Code, Codex, GitHub Copilot, Cursor, or any of the agents that support [Agent Skills Open Standard](https://agentskills.io/), you can install the skill in one command and get better results on every Supabase task.

AI agents already know a lot about Supabase. We hit [100k stars on GitHub](https://supabase.com/blog/100000-github-stars), and most models have seen plenty of Supabase code in their training data. But knowing about Supabase and using it correctly are two different things. We kept seeing agents skip RLS policies on exposed schemas, hallucinate CLI commands that don't exist (like `supabase db execute`), create views without `security_invoker = true` (which silently bypasses RLS), and ignore the docs entirely, relying on training data that may be months out of date.

This is a follow-up to our earlier work on [Postgres best practices for AI agents](https://supabase.com/blog/postgres-best-practices-for-ai-agents). That release focused on general Postgres patterns. Supabase Agent Skills goes further: it covers all Supabase products, encodes security requirements inline, and teaches agents to check the docs before implementing anything.

Install it with one command:

```bash
npx skills add supabase/agent-skills
```

Or install as a Claude Code plugin:

```bash
# 1. Install supabase/agent-skill marketplace
claude plugin marketplace add supabase/agent-skills

# 2. Install the supabase plugin
claude plugin install supabase@supabase-agent-skills
```

## What the skill teaches

The skill covers four areas: documentation access, security, tooling workflow, and schema management. Everything critical lives directly inside `SKILL.md`, about 100 lines total. We put it there on purpose.

### Docs and product knowledge

The core principle: verify against current docs before implementing.

Supabase moves fast. Config options, product documentation and API conventions are examples of things that will change over time. An agent working from training data alone is essentially working from a snapshot — one that could be months or years old.

The skill instructs agents to look up documentation before writing any Supabase-specific code, using three methods in priority order:

1. **MCP `search_docs` tool**: returns relevant snippets ordered by relevance
2. **Fetch docs as markdown**: use bash tools like `curl` to fetch Supabase docs as markdown files. Supabase docs pages can be fetched as markdown by appending `.md` to its URL
3. **Native web search tools**: freely search the web whenever the other two options are not available

The skill doesn't tell agents what the current API looks like. It tells them how to find out. This keeps the skill small, maintainable, and always accurate — the docs are the source of truth, and they're already maintained. There's no value in replicating them inside the skill.

### Security and RLS

Supabase has specific security configurations that the agent might miss. These instructions are described in detail in our documentation. The skill instructs agents to check the Supabase docs before implementing anything, but agents are lazy about it: even with `search_docs` available, they can choose to keep it offline and go with what they already know from training data rather than making an extra round-trip. That means security configurations and patterns might get missed even when the correct guidance exists in the docs.

To ensure agents never skip these, the skill includes an inline checklist of security requirements that apply to every Supabase project. These aren't pulled from docs on demand — they're loaded with the skill, so the agent has no excuse to miss them:

- **Never use `user_metadata` for authorization.** It's user-editable. Use `app_metadata` instead.
- **Never expose the `service_role` key on the frontend.** In Next.js, any `NEXT_PUBLIC_` env var is sent to the browser.
- **Views bypass RLS by default.** Use `security_invoker = true`.
- **UPDATE requires a SELECT policy.** Without one, updates silently return 0 rows. No error, just no change.
- **Storage upsert requires INSERT + SELECT + UPDATE.** Granting only INSERT makes file replacement silently fail.
- **Deleting a user doesn't invalidate their JWT.** You must revoke sessions first.

We originally put security guidance in separate reference files. Agents sometimes skipped them. So we moved everything critical into `SKILL.md` itself, where the agent reads it the moment the skill loads.

### Tooling

Agents have two main ways to work with Supabase: through the Supabase MCP server, or through the Supabase CLI when they have access to a bash environment.

For humans, the command line is still the most common way to interact with a service from the terminal. CLIs expose functionality through shell commands, and well-designed commands typically document themselves through the `--help` flag. That makes the interface discoverable and self-documenting. For an agent, this is especially useful: instead of guessing how a command works, it can inspect `--help`, follow the documented options, and use that information to troubleshoot when something goes wrong.

MCP, by contrast, is designed specifically for agents. An MCP server exposes a service through structured tools that an agent can call directly, without needing terminal access. This makes the interface more natural for agentic workflows. However, an MCP server still has to be configured by a human before the agent can use it. To bridge that gap, the skill includes a short troubleshooting guide that helps the agent assist with common Supabase MCP server connection issues.

In practice, the skill provides targeted guidance for both interfaces:

- **CLI**: always discover commands through `--help`; never guess. The skill also documents known gotchas, such as the `supabase db query` command requiring CLI version 2.79.0 or later.
- **MCP server**: step-by-step guidance for diagnosing and resolving connection issues.

### Schema management

Agents are becoming increasingly autonomous, and we're growing more comfortable giving them direct access to our databases—whether to ship new features or troubleshoot issues. For example, Replit has previously described how its agents autonomously [manage database schema](https://blog.replit.com/production-databases-automated-migrations) changes in development environments.

Supabase enables agents to access databases through both the MCP server and the CLI. While this gives agents the necessary access, it doesn't by itself provide a clear or efficient workflow for managing schema changes.

To address this, the skill introduces an opinionated approach to schema management. Instead of relying on migration-based workflows for every change, agents are encouraged to modify the schema directly using the `execute_sql` MCP tool or the `supabase db query` CLI command. This avoids creating a new migration entry for every DDL operation and enables faster iteration during development.

Once the agent determines that the schema has stabilized, it should run the [Supabase database advisors](https://supabase.com/docs/guides/database/database-advisors) to catch potential security or performance issues early. Only after passing these checks should the agent formalize the changes by committing a migration.

<Admonition type="caution">

We strongly discourage connecting the Supabase MCP server to your production database. This workflow was designed to run against a local or staging database.

</Admonition>

## How we designed it

We tried different formats and reference file structures before landing on the current approach.

We learned that agents are lazy about reading reference files. When they do read one, they tend not to read more. Problems that require knowledge from multiple areas get missed.

So we moved all critical information into `SKILL.md` itself. About 100 lines. The agent gets everything it needs the moment the skill loads. Only one reference file remains: `skill-feedback.md`, a meta-workflow for users to report issues on the [GitHub repo](https://github.com/supabase/agent-skills).

The skill teaches agents _how_ to find current information, not _what_ the current information is. This keeps the skill maintainable and always accurate.

## How we test it

We followed OpenAI's [framework for evaluating agent skills](https://developers.openai.com/blog/eval-skills): define success criteria, manually test, then advance to automated evaluation. As the skill matured, we moved to testing it systematically with an internal tool that runs evaluations automatically across agents and conditions.

### What we measure

- **Skill loading**: does the agent discover and load the skill? This tests whether the name and description work as triggers.
- **Task completeness**: does the agent finish the task? An LLM judge reviews the full transcript and generated files, separating requirements into primary (the core deliverable) and secondary (verification steps, workflow compliance). The judge checks for concrete evidence: actual tool calls, SQL statements, and valid outputs. Not just the agent saying it will do something.

For example, in Postgres, views execute as their creator by default, which means they can bypass Row Level Security (RLS) policies defined on the underlying tables. This can lead to subtle security issues if a view is exposed without the correct configuration.

In this case, the agent is expected to create the view with `security_invoker = true` so that it respects the RLS policies of the querying user.

A typical prompt for the agent might look like:

> Create a view called `reports_view` that returns all reports from the reports table.

When evaluating the agent's performance in this scenario, we use an LLM as a judge to determine whether the task was completed according to the defined success criteria. In this case, the success criteria is that the agent creates the view with `security_invoker = true`.

```sql
-- expected result
create view public.reports_view
with (security_invoker = true)
as
select
  id,
  title,
  created_at
from public.reports;
```

### Test conditions

To understand the performance gains from using the skill—compared to relying only on MCP or the agent's native capabilities—we ran a series of experiments across different scenarios.

Each scenario was evaluated under three conditions to isolate what the skill actually contributes:

- **Baseline**: no tools and no skill (the agent relies purely on its pretrained knowledge)
- **MCP only**: the agent has access to Supabase MCP tools, but no skill
- **MCP + Skill**: the agent has both MCP tools and the skill loaded

We ran these experiments across models from Anthropic (Claude) and OpenAI (GPT) to compare performance across different agent architectures.

Here's what we observed:

| Agent                    | Baseline | MCP only | MCP + Skill |
| ------------------------ | -------- | -------- | ----------- |
| Claude Code (Opus 4.6)   | 58%      | 50%      | **67%**     |
| Claude Code (Sonnet 4.6) | 46%      | 58%      | **71%**     |
| Codex (GPT-5.4)          | 71%      | 71%      | **88%**     |
| Codex (GPT-5.4 Mini)     | 42%      | 63%      | **71%**     |

_Scored by an LLM judge on Braintrust across six Supabase scenarios per condition. These are early results with a small sample size, but they show consistent improvement across all agents and models tested._

### What we learned

Three things stood out:

1. **MCP alone is not enough.** Without workflows or guidelines, agents guess at how to combine tools.
2. **Agents default to training data.** Even with `search_docs` available, the MCP-only agent never called it. The skill steers agents to verify against current docs first.
3. **The bottleneck is context, not capability.** Every model applied `security_invoker` correctly when the skill was available. They knew how to implement it. They just didn't know when.

## If you're writing a skill

If you're building skills for your own product, here's what we learned:

- **Fetch the docs, don't replicate them.** Your docs already exist and are maintained. Teach agents how to find them.
- **Keep the essential inside `SKILL.md`.** Agents are lazy about reading reference files. Put critical knowledge where they can't miss it.
- **Be opinionated.** You know your product best. The skill encodes the judgment calls that training data can't.
- **Test across agents and conditions.** What helps one model might not help another. Evals keep you honest.
- **Start simple, expand later.** This is `v0.1.0`. We'll iterate based on eval results and community feedback.

## Get started

Install all skills:

```bash
npx skills add supabase/agent-skills
```

Or install a specific skill:

```bash
npx skills add supabase/agent-skills --skill supabase
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

Claude Code users can also install as a plugin:

```bash
claude plugin marketplace add supabase/agent-skills
```

- [Supabase Agent Skills Docs](https://supabase.com/docs/guides/getting-started/ai-skills)
- [GitHub repo](https://github.com/supabase/agent-skills)

Found something the skill should cover? [Open an issue](https://github.com/supabase/agent-skills/issues) on the repo. We read each one.
