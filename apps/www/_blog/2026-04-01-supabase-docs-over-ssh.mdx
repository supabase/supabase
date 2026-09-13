---
title: 'Supabase docs over SSH'
description: 'Browse Supabase docs with grep, find, and cat.'
author: gregnr
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=partnerships&layout=icon-text&copy=Supabase+docs+over+SSH&icon=icon-docs.svg&icon2=icon-CLI.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=partnerships&layout=icon-only&copy=supabase.sh&icon=icon-docs.svg&icon2=icon-CLI.svg'
categories:
  - product
tags:
  - docs
  - ai
date: '2026-04-01'
toc_depth: 2
---

We're launching [supabase.sh](https://supabase.sh), a public SSH server that gives AI coding agents direct bash access to Supabase documentation. It's free and available now as a public experiment:

```bash
ssh supabase.sh
```

Coding agents don't know what they don't know. Without access to the latest docs, they guess - and often recommend non-existent APIs, run incorrect CLI commands, or skip steps like enabling RLS. What's the best way to get up-to-date docs in front of them?

If you watch a coding agent work through a codebase, you'll see the same tools over and over: `grep`, `find`, `ls`, `cat`. These models are trained heavily on bash and they treat the file system as their primary interface for exploration.

[supabase.sh](https://supabase.sh) gives them that same interface for our documentation. Every doc page is a markdown file in a virtual file system at `/supabase/docs`. Agents can search across topics, list pages, and read any page as needed. The same workflow they use for code applies to docs.

## Setting up your agent

Add recommended Supabase instructions to your project's `AGENTS.md` or `CLAUDE.md`:

```bash
ssh supabase.sh agents >> AGENTS.md
```

Or let your agent set it up for you:

```bash
ssh supabase.sh setup | claude
```

The snippet tells your agent to check the docs before working with Supabase, keeping it grounded in current docs without hallucinating.

## How it's built

[supabase.sh](https://supabase.sh) runs on [just-bash](https://github.com/vercel-labs/just-bash), an open-source Bash emulator from Vercel written in TypeScript. Commands run inside a sandboxed JavaScript runtime over a virtual file system, which means we can keep it public and unauthenticated without running an actual shell on the server.

This isn't the first time someone has built a public app over SSH. The [Charm](https://charm.sh) team explored this idea with their [Wish](https://github.com/charmbracelet/wish) library, and there are some well-known SSH experiments worth trying (`ssh terminal.shop` is a good one).

We applied the same pattern to documentation - the files served over SSH are the same markdown source that powers [supabase.com/docs](https://supabase.com/docs). It's the same content, just through a bash shell instead of a browser.

## Why bash instead of search?

The [Supabase MCP server](https://supabase.com/docs/guides/getting-started/mcp) already ships a `search_docs` tool - hybrid keyword and semantic search over our docs. It works, but the agent has to know what to ask for up front. It can't browse, skim, or stumble onto something useful by itself.

Bash gives agents the ability to explore without a predefined query. They can list all pages on a topic, search across multiple files at once, and read parts of a page before deciding whether it's relevant. Search is more opaque - the agent asks a question and gets back results without the ability to explore or navigate. With bash, it can `grep` across docs, `cat` specific files, and use `head` and `tail` to skim without bloating its context window.

## Get started

[supabase.sh](https://supabase.sh) is live now. Try it from any terminal:

```bash
ssh supabase.sh
```

To add Supabase context to your project:

```bash
ssh supabase.sh agents >> AGENTS.md
```

It's open source - find the code at [github.com/supabase-community/supabase-ssh](https://github.com/supabase-community/supabase-ssh).

This is an early experiment - let us know what you think. If you run into something or something's missing, [open an issue on GitHub](https://github.com/supabase-community/supabase-ssh/issues/new/choose) or find us on [X](https://x.com/supabase).
