---
name: audit-nextjs-docs
description: >-
  Audit Supabase Next.js quickstarts and the nextjs-user-management web app demo.
  Use when reviewing Next.js docs, quickstarts, with-nextjs tutorial, or
  examples/user-management/nextjs-user-management for version drift, proxy.ts
  conventions, broken links, and build health.
---

# Audit Next.js docs and demo

Run this checklist from the repository root after checking out the branch under review.

## 1. Version matrix

Compare `examples/user-management/nextjs-user-management/package.json` to `pnpm-workspace.yaml` catalog:

| Package | Catalog (`pnpm-workspace.yaml`) |
|---------|----------------------------------|
| `next` | `16.2.6` |
| `@supabase/ssr` | `0.10.2` |
| `react` / `react-dom` | `^19.2.6` |

Record any drift and pin example deps to catalog versions where the example targets Next.js 16.

## 2. Next.js 16 conventions

In `nextjs-user-management` and embedded tutorial samples:

- Session refresh uses `proxy.ts` at project root (not `middleware.ts`)
- Supabase clients live under `lib/supabase/` (`client.ts`, `server.ts`, `proxy.ts`)
- Only one Next config file (`next.config.ts` preferred)

Search docs for stale references:

```bash
rg 'middleware\.ts' apps/docs/content/guides/getting-started/quickstarts/nextjs.mdx \
  apps/docs/content/guides/auth/quickstarts/nextjs.mdx \
  apps/docs/content/guides/getting-started/tutorials/with-nextjs.mdx
```

## 3. Code sample resolution

```bash
cd apps/docs && pnpm codegen:examples
```

Confirm `$CodeSample` paths in these files resolve under `apps/docs/examples/`:

- `apps/docs/content/guides/getting-started/quickstarts/nextjs.mdx`
- `apps/docs/content/guides/auth/quickstarts/nextjs.mdx`
- `apps/docs/content/guides/getting-started/tutorials/with-nextjs.mdx`

## 4. Example app build

```bash
cd examples/user-management/nextjs-user-management
npm ci && npm run build
```

Must exit 0.

## 5. Doc links

- Auth quickstart "Learn more" must resolve — use `/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs` (not `/guides/auth/server-side/nextjs`)
- Framework quickstart `create-next-app -e with-supabase` command present
- Env vars use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not legacy anon-only naming)

## 6. External template smoke test (manual)

The `with-supabase` template is **outside** this repo:

```bash
npx create-next-app -e with-supabase /tmp/with-supabase-smoke
cd /tmp/with-supabase-smoke && npm run build
```

Record pass/fail separately from in-repo example build.

## Output

Summarize in a table:

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Version matrix | | |
| proxy.ts / no stale middleware refs | | |
| Code samples resolve | | |
| nextjs-user-management build | | |
| Auth quickstart link | | |
| External with-supabase (optional) | | |
