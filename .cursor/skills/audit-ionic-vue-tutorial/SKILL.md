---
name: audit-ionic-vue-tutorial
description: >-
  Audit the Ionic Vue user management tutorial against the live Supabase platform.
  Use when reviewing with-ionic-vue.mdx, ionic-vue-user-management, auth flows,
  env vars, or comparing against ionic-react-user-management reference patterns.
  Requires a Supabase project, MCP or dashboard access, and full E2E auth testing.
---

# Audit Ionic Vue tutorial (platform-backed)

A tutorial audit is **not complete** until the example app runs against a real Supabase project and every platform E2E step passes.

## Prerequisites

- Supabase MCP server authenticated, or dashboard access to a dev project
- Project ref (e.g. from dashboard URL: `/project/<ref>`)
- Publishable key and project URL from **Dashboard → Project Settings → API** (never commit `.env`)

## 1. Static checks (necessary but not sufficient)

### Tutorial MDX

File: `apps/docs/content/guides/getting-started/tutorials/with-ionic-vue.mdx`

- `.env` uses `VUE_APP_SUPABASE_PUBLISHABLE_KEY` (not `VUE_APP_SUPABASE_KEY`)
- `$CodeSample` paths match `examples/user-management/ionic-vue-user-management/`
- Run `cd apps/docs && pnpm codegen:examples && pnpm lint:mdx -- content/guides/getting-started/tutorials/with-ionic-vue.mdx`

### Example app build

```bash
cd examples/user-management/ionic-vue-user-management
npm install && npm run build
```

### Auth flow code review

| File | Check |
|------|-------|
| `src/views/Login.vue` | No debug email output (`<p>{{ email }}</p>`) |
| `src/views/Account.vue` | Email from `getClaims()`; website `type="text"`; `useIonRouter` for logout |
| `src/App.vue` | Syncs user via `getUser()`; no conflicting redirect logic |
| `src/router/index.ts` | `beforeEach` guards: `/account` requires user, `/` redirects when logged in |
| `src/store/index.ts` | `user` typed as `User \| null` |
| `src/supabase.ts` | Expects `VUE_APP_SUPABASE_PUBLISHABLE_KEY` |

Compare patterns to `examples/user-management/ionic-react-user-management/`.

## 2. Platform setup (required)

### 2a. Verify or apply tutorial SQL

SQL source: `apps/docs/content/_partials/user_management_quickstart_sql_template.mdx`

Using Supabase MCP on the target project:

1. `list_tables` — confirm `public.profiles` exists with RLS enabled
2. If missing, `apply_migration` with the full profiles + storage SQL from the partial
3. `execute_sql` — confirm policies exist:

```sql
select tablename, policyname from pg_policies where schemaname = 'public' and tablename = 'profiles';
```

### 2b. Configure the example app

Copy `.env.example` → `.env` in `ionic-vue-user-management/`:

```bash
VUE_APP_SUPABASE_URL=https://<project-ref>.supabase.co
VUE_APP_SUPABASE_PUBLISHABLE_KEY=<publishable-key-from-dashboard>
```

Get URL via MCP `get_project_url` if needed; publishable key from dashboard only.

### 2c. Auth settings

In **Dashboard → Authentication → URL configuration**:

- Site URL includes your local dev origin (e.g. `http://localhost:8100`)
- Redirect URLs allow the Ionic dev server origin

## 3. Platform E2E test (required)

Start the app:

```bash
cd examples/user-management/ionic-vue-user-management
npm run dev
```

Walk through each step in the browser. After each step, verify on the platform where noted.

| Step | App behavior | Platform verification |
|------|--------------|----------------------|
| Open `/` | Login form; no email leaked on page | — |
| Submit magic link | Toast "Check your email" | MCP `get_logs` service `auth` — no errors |
| Click magic link | Redirect to `/account` | `execute_sql`: `select id, email from auth.users order by created_at desc limit 1` |
| Account page | Email displayed | Email matches `auth.users` row |
| Update website `example.com` | Save succeeds, no URL validation error | `execute_sql`: `select username, website from profiles where id = '<user-id>'` — website = `example.com` |
| Update website `https://example.com` | Save succeeds | Same query — website updated |
| Logout | Returns to `/` | `/account` redirects to `/` |
| Revisit `/account` while logged out | Blocked at login | — |

If any step fails, check MCP `get_logs` for `auth` and `postgres` before changing app code.

## 4. Output

Record pass/fail for sections 1–3. **Fail the audit** if section 3 was skipped or any platform E2E row failed.

| Section | Pass/Fail | Notes |
|---------|-----------|-------|
| Static checks | | |
| Platform setup | | |
| Platform E2E | | |
