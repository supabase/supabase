---
name: audit-docs-tutorials
description: >-
  Audit getting-started tutorials under apps/docs against the live Supabase platform.
  Use when reviewing tutorial MDX, $CodeSample paths, example builds, env var naming,
  prose table readability, or validating that tutorial SQL and auth flows work on a
  real project. Static checks alone are insufficient — platform E2E is required.
---

# Audit docs tutorials (platform-backed)

Every tutorial with an in-repo example and database/auth steps must be validated on a **real Supabase project**, not only via MDX lint and `npm run build`.

## 1. Inventory

List `apps/docs/content/guides/getting-started/tutorials/*.mdx`.

For each tutorial record:

| Tutorial | Example path | SQL partial / setup | Env prefix | Static pass | **Platform E2E pass** |
|----------|--------------|---------------------|------------|-------------|----------------------|
| with-nextjs.mdx | `user-management/nextjs-user-management` | `user_management_quickstart_sql_template.mdx` | `NEXT_PUBLIC_` | | |
| with-ionic-vue.mdx | `user-management/ionic-vue-user-management` | same | `VUE_APP_` | | |
| with-ionic-react.mdx | `user-management/ionic-react-user-management` | same | `REACT_APP_` / Vite | | |
| ... | | | | | |

Tutorials without in-repo examples: note **external-only** and document manual platform smoke test if applicable.

## 2. Static checks (all tutorials)

```bash
cd apps/docs && pnpm codegen:examples
pnpm lint:mdx -- content/guides/getting-started/tutorials/
```

- Every `$CodeSample path="..."` resolves under `apps/docs/examples/`
- Env var names in MDX match the example app's `supabase` client file
- Example `npm install && npm run build` succeeds

## 3. Platform setup (tutorials with auth + database)

For each user-management-style tutorial:

### 3a. Supabase project

Use a dedicated dev project (MCP `list_projects` or dashboard). Do not use production.

### 3b. Apply tutorial SQL

Locate the SQL partial referenced by the tutorial (commonly `user_management_quickstart_sql_template.mdx`).

Via MCP:

1. `list_tables` — verify `profiles` (and `avatars` storage bucket if applicable)
2. `apply_migration` if schema missing
3. `execute_sql` to confirm RLS policies on `profiles`

### 3c. Configure example `.env`

| Framework | URL var | Key var |
|-----------|---------|---------|
| Next.js | `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Ionic Vue | `VUE_APP_SUPABASE_URL` | `VUE_APP_SUPABASE_PUBLISHABLE_KEY` |
| Ionic React | `REACT_APP_SUPABASE_URL` | `REACT_APP_SUPABASE_PUBLISHABLE_KEY` |

Publishable key from dashboard only — never commit `.env`.

### 3d. Auth URL configuration

Dashboard → Authentication → URL configuration: add local dev origin and redirect URLs.

## 4. Platform E2E (required per tutorial)

Run the example app locally against the configured project. Minimum flow for user-management tutorials:

| Step | Verify on platform |
|------|-------------------|
| Sign up / magic link login | `get_logs` auth; user row in `auth.users` |
| Protected route access | Session present after redirect |
| Profile read | `select * from profiles where id = '<user-id>'` |
| Profile update | Row reflects new `username` / `website` |
| Logout | Session cleared; protected route blocked |

Tutorial-specific skills (e.g. `audit-ionic-vue-tutorial`) contain framework-specific E2E tables — run those in full.

On failure: MCP `get_logs` for `auth` and `postgres` before editing tutorial or example code.

## 5. Prose table readability (guide pages)

Guide tables use remark-gfm + `.prose` in `apps/docs`. Check `apps/docs/styles/globals.css`:

- First-column `code` uses `break-words` (not `break-all`)
- First column has `min-width: 12rem` where variable names appear

Spot-check `auth-email-templates.mdx` Terminology table on a running docs preview.

## 6. Output

**Fail the audit** if any in-repo tutorial lacks a platform E2E result.

| Tutorial | Static | Platform setup | Platform E2E | Notes |
|----------|--------|----------------|--------------|-------|
| | | | | |
