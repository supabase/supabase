---
name: audit-quickstarts
description: >-
  Audit Supabase framework and auth product quickstart MDX guides. Use when
  reviewing getting-started quickstarts, auth quickstarts, codegen:examples
  sync, MDX lint, or mapping quickstarts to companion example apps. Does not
  cover tutorials — use per-framework tutorial skills instead.
---

# Audit quickstarts

## Scope

This skill covers **quickstart MDX only** — two tiers:

| Tier | Path | Example |
|------|------|---------|
| **Framework quickstarts** | `guides/getting-started/quickstarts/` | `nextjs.mdx`, `reactjs.mdx`, … |
| **Auth product quickstarts** | `guides/auth/quickstarts/` | `nextjs.mdx`, `react.mdx`, … |

**Out of scope:** `guides/getting-started/tutorials/` — tutorials are full walkthroughs with in-repo example apps. Audit those with per-framework tutorial skills (e.g. [`audit-nextjs-docs`](../audit-nextjs-docs/SKILL.md) for Next.js).

## 1. MDX lint

From repo root:

```bash
cd apps/docs
pnpm codegen:examples
pnpm lint:mdx -- content/guides/getting-started/quickstarts/
pnpm lint:mdx -- content/guides/auth/quickstarts/
```

## 2. Framework quickstarts inventory

List every file in `apps/docs/content/guides/getting-started/quickstarts/*.mdx`.

For each, record:

| Quickstart | Companion example in `examples/` | External-only | Build tested |
|------------|-----------------------------------|---------------|--------------|
| nextjs.mdx | — | `create-next-app -e with-supabase` | |
| reactjs.mdx | | | |
| ... | | | |

**External-only** quickstarts have no in-repo example — note manual smoke test instead of `npm run build`.

## 3. Auth product quickstarts inventory

List every file in `apps/docs/content/guides/auth/quickstarts/*.mdx`.

For each, record:

| Quickstart | Companion example in `examples/` | Build tested |
|------------|-----------------------------------|--------------|
| nextjs.mdx | — (inline steps) | |
| react.mdx | | |
| ... | | |

Audit each auth quickstart for:

- Env var naming (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, etc.)
- Internal doc links resolve (no 404 on docs preview)
- `$CodeSample` paths resolve after `codegen:examples`

## 4. Spot-check builds

Run `npm install && npm run build` (or framework equivalent) for quickstarts that ship in-repo companion examples — **not** tutorial apps:

- At least one framework quickstart with an in-repo example (if any)
- At least three auth or framework quickstarts with companion apps (e.g. `ionic-vue-user-management`, `expo-*`)

For Next.js specifically, use [`audit-nextjs-docs`](../audit-nextjs-docs/SKILL.md) instead of duplicating checks here.

## 5. Codegen sync

`apps/docs/package.json` `codegen:examples` copies `../../examples` → `apps/docs/examples`. Verify copy is fresh before lint or docs build.

## Output

Produce a pass/fail table per quickstart MDX file (split by tier) and note any broken links, missing examples, or build failures.
