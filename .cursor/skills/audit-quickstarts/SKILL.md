---
name: audit-quickstarts
description: >-
  Audit all Supabase framework and auth quickstart MDX guides. Use when reviewing
  getting-started quickstarts, auth quickstarts, codegen:examples sync, MDX lint,
  or mapping quickstarts to companion example apps.
---

# Audit all quickstarts

## 1. MDX lint

From repo root:

```bash
cd apps/docs
pnpm codegen:examples
pnpm lint:mdx -- content/guides/getting-started/quickstarts/
pnpm lint:mdx -- content/guides/auth/quickstarts/
```

## 2. Inventory framework quickstarts

List every file in `apps/docs/content/guides/getting-started/quickstarts/*.mdx`.

For each, record:

| Quickstart | Companion example in `examples/` | External-only | Build tested |
|------------|-----------------------------------|---------------|--------------|
| nextjs.mdx | `auth/nextjs-full` (with-supabase mirror); tutorial uses `user-management/nextjs-user-management` | `create-next-app -e with-supabase` | |
| reactjs.mdx | | | |
| ... | | | |

**External-only** quickstarts have no in-repo example — note manual smoke test instead of `npm run build`.

## 3. Auth quickstarts

Audit `apps/docs/content/guides/auth/quickstarts/*.mdx`:

- Env var naming (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, etc.)
- Internal doc links resolve (no 404 on docs preview)
- `$CodeSample` paths resolve after `codegen:examples`

## 4. Spot-check builds (minimum 3 non-Next + Next)

Run `npm ci && npm run build` (or framework equivalent) for quickstarts that ship in-repo examples:

- `examples/user-management/nextjs-user-management` (Next.js)
- At least three others with companion apps (e.g. `ionic-vue-user-management`, `nextjs-todo-list`, `expo-*`)

## 5. Codegen sync

`apps/docs/package.json` `codegen:examples` copies `../../examples` → `apps/docs/examples`. Verify copy is fresh before lint or docs build.

## Output

Produce a pass/fail table per quickstart MDX file and note any broken links, missing examples, or build failures.
