---
name: audit-nextjs-docs
description: >-
  Audit Supabase Next.js docs across all three tiers: framework quickstart,
  tutorial, and auth product quickstart. Use when reviewing Next.js docs,
  with-nextjs tutorial, or examples/user-management/nextjs-user-management for
  version drift, proxy.ts conventions, broken links, and build health.
---

# Audit Next.js docs

Run this checklist from the repository root after checking out the branch under review.

## Docs tier model

Supabase Next.js content spans three distinct tiers — do not conflate them:

| Tier | Path | MDX file | Companion asset |
|------|------|----------|-----------------|
| **Framework quickstart** | `guides/getting-started/quickstarts/` | `nextjs.mdx` | External `create-next-app -e with-supabase` template |
| **Tutorial** | `guides/getting-started/tutorials/` | `with-nextjs.mdx` | In-repo `examples/user-management/nextjs-user-management` |
| **Auth product quickstart** | `guides/auth/quickstarts/` | `nextjs.mdx` | Inline MDX steps (no dedicated example app) |

For cross-framework quickstart audits (all frameworks, quickstarts only), use [`audit-quickstarts`](../audit-quickstarts/SKILL.md).

## Shared checks (all tiers + example app)

### Version matrix

Compare `examples/user-management/nextjs-user-management/package.json` to `pnpm-workspace.yaml` catalog:

| Package | Catalog (`pnpm-workspace.yaml`) |
|---------|----------------------------------|
| `next` | `16.2.6` |
| `@supabase/ssr` | `0.10.2` |
| `react` / `react-dom` | `^19.2.6` |

Record any drift and pin example deps to catalog versions where the example targets Next.js 16.

### Next.js 16 conventions

In `nextjs-user-management` and embedded tutorial samples:

- Session refresh uses `proxy.ts` at project root (not `middleware.ts`)
- Supabase clients live under `lib/supabase/` (`client.ts`, `server.ts`, `proxy.ts`)
- Only one Next config file (`next.config.ts` preferred)

Search all three Next.js MDX files for stale references:

```bash
rg 'middleware\.ts' apps/docs/content/guides/getting-started/quickstarts/nextjs.mdx \
  apps/docs/content/guides/auth/quickstarts/nextjs.mdx \
  apps/docs/content/guides/getting-started/tutorials/with-nextjs.mdx
```

## Framework quickstart

File: `apps/docs/content/guides/getting-started/quickstarts/nextjs.mdx`

- `create-next-app -e with-supabase` command present
- Env vars use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not legacy anon-only naming)
- `$CodeSample` paths resolve after `codegen:examples` (see below)

### External template smoke test (manual)

The `with-supabase` template is **outside** this repo:

```bash
npx create-next-app -e with-supabase /tmp/with-supabase-smoke
cd /tmp/with-supabase-smoke && npm run build
```

Record pass/fail separately from in-repo example build.

## Tutorial

File: `apps/docs/content/guides/getting-started/tutorials/with-nextjs.mdx`
Example: `examples/user-management/nextjs-user-management`

```bash
cd apps/docs && pnpm codegen:examples
```

Confirm `$CodeSample` paths in `with-nextjs.mdx` resolve under `apps/docs/examples/`.

```bash
cd examples/user-management/nextjs-user-management
npm install && npm run build
```

Must exit 0.

## Auth product quickstart

File: `apps/docs/content/guides/auth/quickstarts/nextjs.mdx`

- "Learn more" link must resolve — use `/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs` (not `/guides/auth/server-side/nextjs`)
- Env vars use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `$CodeSample` paths resolve after `codegen:examples`

## Output

Summarize in a table:

| Tier / check | Pass/Fail | Notes |
|--------------|-----------|-------|
| Version matrix | | |
| proxy.ts / no stale middleware refs | | |
| Framework quickstart | | |
| Tutorial — code samples resolve | | |
| Tutorial — nextjs-user-management build | | |
| Auth product quickstart | | |
| External with-supabase (optional) | | |
