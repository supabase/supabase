# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Full monorepo conventions, skills, and architecture are in `.claude/CLAUDE.md` — read that first for any Studio or package work.

## Running the stack

All commands run from `supabase/docker/`:

```bash
# Start everything (first time or after config changes)
docker compose up -d --build

# Start everything without rebuilding
docker compose up -d

# Rebuild only Studio (after changing apps/studio source)
docker compose up -d --build studio

# Stop everything
docker compose down
```

**Ports:**
- Studio dashboard → http://localhost:8082
- API gateway (Envoy) → http://localhost:8000
- pg-meta (direct) → http://localhost:5555
- Postgres default → localhost:5433
- Pooler (Supavisor) → localhost:5434

**Credentials (defaults):** username `supabase`, password `this_password_is_insecure_and_should_be_updated`

## How Studio connects to the backend in Docker

The Studio container (`node:22-slim`, `dev` stage of `apps/studio/Dockerfile`) runs `pnpm dev:studio` (Next.js dev server on port 8082).

**Critical env var problem:** Next.js loads `.env` from the filesystem before Docker env vars take effect for server-side `process.env`. The `.env` baked into the image has `localhost` values for host dev. To override them inside the container, `docker-entrypoint.sh` writes a `.env.local` (highest Next.js priority) to `/app/apps/studio/.env.local` at startup from Docker env vars.

`ENTRYPOINT ["docker-entrypoint.sh"]` resolves to `/usr/local/bin/docker-entrypoint.sh` (overrides the node base image's default). The Dockerfile explicitly copies `apps/studio/docker-entrypoint.sh → /usr/local/bin/docker-entrypoint.sh`.

Key env vars the entrypoint writes:
- `STUDIO_PG_META_URL=http://supabase-meta:8080` — Studio → pg-meta route
- `POSTGRES_HOST=db-default` / `POSTGRES_DOCKER_HOST=db-default` — used to build encrypted connection strings
- `PG_META_CRYPTO_KEY` — must match the `CRYPTO_KEY` set on the `supabase-meta` container (default: `af32d6ff9af8b539f9d1b8579f702cd4`)

## Multi-database registry

`docker/volumes/registry/databases.json` is the single source of truth for all databases. Each entry has a `ref` (slug used in URLs), Docker service hostname, and env var names for secrets.

`apps/studio/lib/api/self-hosted/registry.ts` reads this file at runtime (`readFileSync`). Missing file = silent fallback to single-DB env vars (backward compatible).

Studio API routes under `pages/api/platform/pg-meta/[ref]/` and `pages/api/platform/projects/` all resolve the `ref` against the registry.

## Self-hosted API layer

`apps/studio/lib/api/self-hosted/` contains the entire self-hosted routing logic:

| File | Role |
|---|---|
| `registry.ts` | Reads `databases.json`, exports `getAllDatabases()` / `getDatabaseByRef(ref)` |
| `util.ts` | `getConnectionStringForRef(ref)` builds a Postgres URL; `encryptString()` / `decryptString()` wrap crypto-js AES |
| `pg-meta-headers.ts` | `getPgMetaConnectionHeaders(ref, headers)` — injects `x-connection-encrypted` header so pg-meta connects to the right DB |
| `query.ts` | `executeQuery()` — POSTs SQL to `${STUDIO_PG_META_URL}/query` with the per-ref connection header |
| `settings.ts` | Resolves JWT/anon/service keys per ref from registry env vars |

`IS_PLATFORM` (`NEXT_PUBLIC_IS_PLATFORM === 'true'`) gates all self-hosted paths. It is baked at build time. In Docker it is `false` (not set in `.env`).

## Debugging connectivity

A temporary diagnostic endpoint exists at `pages/api/debug-network.ts` — **remove before shipping to production**:
```bash
curl -s http://localhost:8082/api/debug-network | python3 -m json.tool
```
Shows: resolved `pgMetaUrl`, DNS result for `supabase-meta`, and whether the HTTP fetch to pg-meta succeeds.

## Host dev (without Docker)

Requires Node >= 22.13 and pnpm 11. Use `.env.local` in `apps/studio/` to override `.env`:
```
STUDIO_PG_META_URL=http://localhost:5555
POSTGRES_HOST=localhost
NEXT_PUBLIC_IS_PLATFORM=false
```
Then: `pnpm dev:studio` from repo root.

## Dokploy production deployment

**Files:**
- `docker/docker-compose.prod.yml` — Traefik labels, port cleanup, production Studio target
- `docker/.env.production` — all required env vars with descriptions

**Steps:**

1. In Dokploy UI → New Application → Docker Compose
2. Point to this repo; set compose files to:
   ```
   docker/docker-compose.yml
   docker/docker-compose.prod.yml
   ```
3. Copy `docker/.env.production`, fill in all values, paste into Dokploy's Environment Variables panel
4. Ensure the `traefik-public` external network exists on the Dokploy host (Dokploy creates it automatically — verify in Dokploy → Networks)
5. Deploy — Studio builds from source (`production` target, ~5 min first time)

**Key differences from local dev:**

| Setting | Local dev | Dokploy prod |
|---|---|---|
| Studio build target | `dev` (hot reload) | `production` (standalone Next.js) |
| Studio port | `8082:8082` | Traefik → `studio:3000` |
| API port | `8000:8000` | Traefik → `envoy:8000` |
| Domains | `localhost` | real domains via `API_DOMAIN` / `STUDIO_DOMAIN` |
| Postgres exposed | `5433` on host | internal only (removed in prod overlay) |

**Generate JWT keys** for `ANON_KEY` and `SERVICE_ROLE_KEY`:
```
# Using the JWT_SECRET you chose:
# https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
```
