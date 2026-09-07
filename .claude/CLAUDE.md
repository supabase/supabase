# Supabase Monorepo

pnpm 11 + Turborepo monorepo. Requires Node >= 22.13.

## Structure

| Directory                | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `apps/studio`            | Supabase Studio/Dashboard — has its own `apps/studio/CLAUDE.md` (see below) |
| `apps/docs`              | Documentation site — Next.js app router, MDX (port 3001)                    |
| `apps/www`               | Marketing website — Next.js, app + pages (port 3000)                        |
| `apps/design-system`     | Component demos — source of truth for Studio UI patterns (port 3003)        |
| `apps/ui-library`        | shadcn-style registry site for Supabase UI blocks (port 3004)               |
| `apps/lite-studio`       | Lightweight Studio — different stack: React Router 7 + Vite + Tailwind v4   |
| `packages/ui`            | Shared UI components (shadcn/ui based) — `import { Button } from 'ui'`      |
| `packages/ui-patterns`   | Composite components — subpath imports, e.g. `ui-patterns/AssistantChat`    |
| `packages/common`        | Shared utils, telemetry constants, feature flags                            |
| `packages/api-types`     | Generated platform Management API types                                     |
| `packages/pg-meta`       | SQL builders for Postgres introspection (`SafeSqlFragment`)                 |
| `packages/shared-data`   | Static data: pricing, plans, regions, error codes                           |
| `e2e/studio`, `e2e/docs` | Playwright E2E tests                                                        |
| `supabase/`              | Local Supabase project: edge functions, migrations, config.toml             |

## Common Commands

```bash
pnpm dev:studio              # run Studio dev server → http://localhost:8082
pnpm dev:docs                # run docs dev server
pnpm dev:www                 # run www dev server
pnpm test:studio             # Studio unit tests (vitest)
pnpm e2e                     # Studio E2E tests (playwright)
pnpm build --filter=studio   # build Studio
pnpm lint --filter=studio    # lint Studio
pnpm typecheck               # typecheck all packages
pnpm format                  # Prettier write (check: pnpm test:prettier)
pnpm generate:types          # local DB types → supabase/functions/common/database-types.ts
pnpm api:codegen             # platform Management API types → packages/api-types
```

## CI

Every PR must pass typecheck + lint (one workflow), Prettier, and a typos check. Other checks are path-filtered: Studio unit tests/build and the lint ratchet (ESLint warning count must not increase) run on `apps/studio/**` changes; app-specific test suites run on their own paths.

Never hand-edit generated files: `packages/api-types/types/**`, `**/routeTree.gen.ts`, `**/__generated__/**`, `apps/docs/features/docs/generated/**`, `apps/www/.generated/**`, `supabase/functions/common/database-types.ts`.

## Conventions

**UI** — import from `'ui'`; primitives are shadcn/ui-based and exported unsuffixed (`Input`, `Select`, `Form`, …). Use `Button` — the in-house component and the standard everywhere (a raw shadcn `Button_Shadcn_` also exists but is rarely the right choice). Check `packages/ui/index.tsx` before creating new primitives. Higher-level patterns live in `packages/ui-patterns`.

**Styling** — Tailwind only, semantic tokens (`bg-muted`, `text-foreground-light`), no hardcoded colors.

**Exports** — named exports only; default exports are allowed only where a framework requires them (`pages/**`, `app/**`, config files — the eslint preset has the exact carve-out list). Lint-enforced across all apps via `eslint-config-supabase` (severity `warn` everywhere; hard-enforced in Studio by the lint ratchet).

**Language** — Use U.S. English everywhere.

## Skills

The skills in `.claude/skills/` are the source of truth for conventions — load the relevant ones before working, don't guess:

- `copywriting` — any user-facing text, anywhere in the monorepo
- `docs-content` — anything under `apps/docs`
- `telemetry-standards` — PostHog events, `packages/common/telemetry-constants.ts`
- `dev-toolbar-review` — `packages/dev-tools`, `packages/common/posthog-client.ts`, `packages/common/feature-flags.tsx`
- `safe-sql-execution` — any code that builds or executes SQL against user databases
- `react-hook-form` — writing or modifying any form code, anywhere in the monorepo
- `vitest` / `vercel-composition-patterns` — generic unit-testing and React composition references

## Studio

Before working on anything in `apps/studio`, read `apps/studio/CLAUDE.md` if it isn't already in context — it maps Studio tasks to required skills and covers the TanStack Start migration rules.

---

## Custom Work: Multi-Database Self-Hosted Support

This fork adds the ability to run **multiple independent Postgres databases** (each a full Supabase project) from a single self-hosted deployment. The upstream code assumes exactly one database; these changes extend every layer to support N databases.

### Why

The upstream self-hosted stack hard-codes a single `DEFAULT_PROJECT` and a single set of `POSTGRES_*` env vars. This feature allows operators to register multiple databases in a central registry so Studio can manage all of them, each with isolated auth (GoTrue), REST (PostgREST), pooler (Supavisor), and Realtime tenants.

### Architecture

#### Registry — single source of truth

`docker/volumes/registry/databases.json` — a JSON file listing all databases with their `ref` (unique slug), `host`, `port`, `database`, and env-var names for secrets. Mounted into the Studio container.

`apps/studio/lib/api/self-hosted/registry.ts` — TypeScript reader. Exports `getAllDatabases()` and `getDatabaseByRef(ref)`. All self-hosted routing logic reads from here instead of hardcoded env vars.

#### Studio changes

| File | What changed |
|---|---|
| `lib/api/self-hosted/util.ts` | `getConnectionString()` now accepts an optional `ref`; looks up the registry before falling back to single-DB env vars |
| `lib/api/self-hosted/pg-meta-headers.ts` | New helper — builds `x-connection-encrypted` header per ref so each pg-meta call hits the right DB |
| `lib/api/self-hosted/settings.ts` | Settings resolver now resolves JWT/anon/service keys per ref from the registry |
| `lib/api/self-hosted/query.ts` | All pg-meta proxy routes now pass `getPgMetaConnectionHeaders(ref, ...)` |
| `pages/api/platform/projects/index.ts` | Returns all registry databases as project objects instead of a single `DEFAULT_PROJECT` |
| `pages/api/platform/projects/[ref]/index.ts` | Per-ref project detail resolved from registry |
| `pages/api/platform/pg-meta/[ref]/*` | All pg-meta routes forward the per-ref encrypted connection header |
| `components/interfaces/MultiDatabaseBanner.tsx` | UI banner shown in multi-DB mode |
| `hooks/useMultiDatabaseProjects.ts` | Hook that fetches the project list and detects multi-DB mode |

#### Docker changes

| File | Purpose |
|---|---|
| `docker/docker-compose.multi.yml` | Auto-generated overlay (via `generate-multi.py`) that adds per-DB containers (db, auth, rest, pooler) |
| `docker/generate-multi.py` | Python script — reads `databases.json`, writes `docker-compose.multi.yml` |
| `docker/scripts/` | Helper shell scripts for adding databases and applying Envoy config |
| `docker/volumes/api/envoy/cds.multi.yaml` | Envoy CDS config for multi-DB cluster routing |
| `docker/volumes/api/envoy/lds.multi.patch.yaml` | Envoy LDS patch for per-ref path routing |
| `scripts/add-database.sh` | Interactive script to add a new database entry to the registry and regenerate compose |

#### Key invariant — backward compatibility

When `databases.json` contains only `"ref": "default"` (or the registry file is absent), every function falls back to the original single-database env-var path. No existing single-DB deployments break.

### Running multi-DB mode

```bash
# 1. Edit docker/volumes/registry/databases.json — add your databases
# 2. Regenerate the multi compose overlay
python3 docker/generate-multi.py

# 3. Start everything
docker compose -f docker/docker-compose.yml -f docker/docker-compose.multi.yml up -d

# 4. Or use the helper
bash scripts/add-database.sh
```

See `docker/MULTI_DATABASE.md` for the full setup guide.

### Testing

```bash
# Unit tests for the custom self-hosted layer
pnpm --filter studio vitest run apps/studio/lib/api/self-hosted
pnpm --filter studio vitest run apps/studio/hooks/useMultiDatabaseProjects
pnpm --filter studio vitest run apps/studio/pages/api/platform/projects
```
