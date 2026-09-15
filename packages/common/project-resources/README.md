# Project resources

`analyzeProjectResources` accepts project-relative source files and returns tables, Edge Functions, API routes, and pages. It does not read a filesystem, fetch files, execute SQL or project code, or depend on React. Callers supply source content and choose how to display the result.

```ts
import { analyzeProjectResources } from 'common/project-resources'

const { resources, diagnostics } = await analyzeProjectResources(
  [
    { path: 'app/account/page.tsx' },
    {
      path: 'supabase/migrations/20260911000000_profiles.sql',
      content: 'create table public.profiles (id uuid primary key);',
    },
  ],
  { framework: 'nextjs' }
)
```

Paths must be relative to one project root. Remove repository, package, or registry packaging prefixes before calling. `content` is optional for conventional file routes and default Edge Function entrypoints, required for SQL and React Router/TanStack route classification. Duplicate paths merge when their contents agree; conflicting contents produce a diagnostic and exclude that file. Resource IDs and output ordering are deterministic. `files` records source evidence, not every runtime dependency.

## Scope

- **Tables:** The asynchronous `libpg-query` Postgres 17 WASM parser reads `.sql` files under `supabase/migrations` and `supabase/schemas` in lexicographic path order. Explicit `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`, and tables inside `CREATE SCHEMA` count; temporary tables, references, views, policies, and SQL strings inside functions do not. Later explicit drops, table renames, and schema moves update tables created in the supplied files. Basic `BEGIN`/`COMMIT`/`ROLLBACK` is supported within a file. Unqualified names use Supabase's default `public` schema unless a static `SET search_path` within that file selects another schema.
- **Edge Functions:** Default functions require `supabase/functions/<name>/index.ts`. A real TOML parser reads `supabase/config.toml` for custom entrypoints relative to that configuration file and `enabled = false`. Shared folders and tests are excluded. Missing entrypoints and malformed configuration produce diagnostics.
- **Next.js:** App Router `page` and `route` files and Pages Router pages/API files, including `src`, route groups, dynamic parameters, and index routes. Layout infrastructure, private folders, parallel slots, and intercepting routes do not become independent pages.
- **Nuxt:** Conventional `app/pages` or `pages` Vue files, plus `server/api` and `server/routes` handlers. HTTP method suffixes share one route; middleware and composables are excluded.
- **TanStack:** Static exported `createFileRoute`/`createLazyFileRoute` declarations distinguish page components from server routes. Pathless/root layouts are excluded. A loader alone does not establish a page or API handler.
- **React Router:** The default `@react-router/fs-routes` filename convention and static module exports distinguish default page components from loader/action-only resource routes. Only top-level route modules or an immediate route folder's `route` module count; colocated helpers are excluded. Arbitrary `routes.ts` configuration is not executed. Optional/escaped filename conventions produce diagnostics.
- **Flutter:** Dart files under `lib/pages` identify screens; no URL route is invented.
- **Generic:** Unambiguous Next/Nuxt file conventions and static TanStack declarations are recognized. Ambiguous `routes` files produce diagnostics.

## Limits

This is a source inventory, not a database migration runner or framework compiler. It cannot prove that a declaration executes, that a project builds, or that the supplied files are complete. Runtime SQL, cascade effects, savepoints, cross-file transaction state, custom routing configuration, generated routes, import aliases for route factories, and dynamic route options are not fully evaluated. Diagnostics identify incomplete analysis rather than creating speculative resources. Tables added by executing a stored function are intentionally excluded. Search-path resolution assumes declared schemas exist; role-dependent search paths are reported as ambiguous.

The SQL parser initializes asynchronously and may load its WASM runtime. Keep this utility in a build or analysis boundary if the consumer should not bundle the parser into its application UI.

Conventions follow the official [Postgres CREATE TABLE documentation](https://www.postgresql.org/docs/17/sql-createtable.html), [Supabase function configuration](https://supabase.com/docs/guides/functions/function-configuration), [Next.js page convention](https://nextjs.org/docs/app/api-reference/file-conventions/page), [Nuxt server convention](https://nuxt.com/docs/4.x/directory-structure/server), [TanStack file routes](https://tanstack.com/router/latest/docs/routing/file-naming-conventions), and [React Router file routes](https://reactrouter.com/how-to/file-route-conventions).

Run the tests with `node --import tsx --test packages/common/project-resources/*.test.ts` from the monorepo root.
