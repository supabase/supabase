# Changelog

All notable changes to the Supabase self-hosted Docker configuration.

Changes are grouped by service rather than by change type. See [versions.md](./versions.md) 
for complete image version history and rollback information.

Check updates for each service to learn more.

**Note:** Configuration updates marked with "requires [...] update" are already included in the latest version of the repository. Pull the latest changes or refer to the linked PR for manual updates. After updating `docker-compose.yml`, pull latest images and recreate containers - use `docker compose down && docker compose pull && docker compose up -d`.

---

## Unreleased

[...]

---

## [2025-11-26]

### Studio
- Updated to `2025.11.26-sha-8f096b5`
- Fixed MCP `get_advisors` tool - PR [#40783](https://github.com/supabase/supabase/pull/40783)
- Fixed AI Assistant request schema - PR [#40830](https://github.com/supabase/supabase/pull/40830)
- Fixed log drains page - PR [#40835](https://github.com/supabase/supabase/pull/40835)

### Realtime
- Updated to `v2.65.3` - [Release](https://github.com/supabase/realtime/releases/tag/v2.65.3)

### Analytics (Logflare)
- Updated to `v1.26.13` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.26.13)
- Fixed crashdump when `POSTGRES_BACKEND_URL` is malformed - PR [logflare#2954](https://github.com/Logflare/logflare/pull/2954)

---

## [2025-11-25]

### Studio
- Updated to `2025.11.24-sha-d990ae8` - [Dashboard updates](https://github.com/orgs/supabase/discussions/40734)
- Fixed Queues configuration UI and added [documentation for exposed queue schema](https://supabase.com/docs/guides/queues/expose-self-hosted-queues) - PR [#40078](https://github.com/supabase/supabase/pull/40078)
- Fixed parameterized SQL queries in MCP tools - PR [#40499](https://github.com/supabase/supabase/pull/40499)
- Fixed Studio showing paid options for log drains - [PR #40510](https://github.com/supabase/supabase/pull/40510)
- Fixed AI Assistant authentication - PR [#40654](https://github.com/supabase/supabase/pull/40654)

### Auth
- Updated to `v2.183.0` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md) | [Release](https://github.com/supabase/auth/releases/tag/v2.183.0)

### Realtime
- Updated to `v2.65.2` - [Release](https://github.com/supabase/realtime/releases/tag/v2.65.2)

### Storage
- Updated to `v1.32.0` - [Release](https://github.com/supabase/storage/releases/tag/v1.32.0)

### Edge Runtime
- Updated to `v1.69.25` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.25)

### Analytics (Logflare)
- Updated to `v1.26.12` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.26.12)
- Fixed Auth logs query - PR [logflare#2936](https://github.com/Logflare/logflare/pull/2936)
- Fixed build configuration to prevent crashes with "Illegal instruction (core dumped)" - PR [logflare#2942](https://github.com/Logflare/logflare/pull/2942)

---

## [2025-11-17]

### Storage
- No image update
- Fixed resumable uploads for files larger than 6MB (requires `docker-compose.yml` update) - PR [#40500](https://github.com/supabase/supabase/pull/40500)

---

## [2025-11-12]

### Studio
- Updated to `2025.11.10-sha-5291fe3` - [Dashboard updates](https://github.com/orgs/supabase/discussions/40083)
- Added log drains - PR [#28297](https://github.com/supabase/supabase/pull/28297)
- Fixed Studio using `postgres` role instead of `supabase_admin` - PR [#39946](https://github.com/supabase/supabase/pull/39946)

### Auth
- Updated to `v2.182.1` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md#21821-2025-11-05) | [Release](https://github.com/supabase/auth/releases/tag/v2.182.1)

### Realtime
- Updated to `v2.63.0` - [Release](https://github.com/supabase/realtime/releases/tag/v2.63.0)

### Storage
- Updated to `v1.29.0` - [Release](https://github.com/supabase/storage/releases/tag/v1.29.0)

### Edge Runtime
- Updated to `v1.69.23` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.23)

### Supavisor
- Updated to `v2.7.4` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.4)

---

## [2025-11-05]

### Studio
- No image update
- Fixed Studio failing to connect to Postgres with non-default settings (requires `docker-compose.yml` update) - PR [#40169](https://github.com/supabase/supabase/pull/40169)

### Realtime
- No image update
- Fixed realtime logs not showing in Studio (requires `volumes/logs/vector.yml` update) - PR [#39963](https://github.com/supabase/supabase/pull/39963)

---

## [2025-10-28]

### Studio
- Updated to `2025.10.27-sha-85b84e0` - [Dashboard updates](https://github.com/orgs/supabase/discussions/40083)
- Fixed broken authentication when uploading files to Storage - PR [#39829](https://github.com/supabase/supabase/pull/39829)

### Realtime
- Updated to `v2.57.2` - [Release](https://github.com/supabase/realtime/releases/tag/v2.57.2)

### Storage
- Updated to `v1.28.2` - [Release](https://github.com/supabase/storage/releases/tag/v1.28.2)

### Postgres Meta
- Updated to `v0.93.1` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.93.1)

### Edge Runtime
- Updated to `v1.69.15` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.15)

---

## [2025-10-27]

### Studio
- No image update
- Added Kong configuration for MCP server routes (requires `volumes/api/kong.yml` update) - PR [#39849](https://github.com/supabase/supabase/pull/39849)
- Added [documentation page](https://supabase.com/docs/guides/self-hosting/enable-mcp) for MCP server configuration - PR [#39952](https://github.com/supabase/supabase/pull/39952)

---

## [2025-10-21]

### Studio
- Updated to `2025.10.20-sha-5005fc6` - [Dashboard updates](https://github.com/orgs/supabase/discussions/39709)
- Fixed issues with Edge Functions and cron logs not being visible in Studio - PR [#39388](https://github.com/supabase/supabase/pull/39388), PR [#39704](https://github.com/supabase/supabase/pull/39704), PR [#39711](https://github.com/supabase/supabase/pull/39711)

### Realtime
- Updated to `v2.56.0` - [Release](https://github.com/supabase/realtime/releases/tag/v2.56.0)

### Storage
- Updated to `v1.28.1` - [Release](https://github.com/supabase/storage/releases/tag/v1.28.1)

### Postgres Meta
- Updated to `v0.93.0` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.93.0)

### Edge Runtime
- Updated to `v1.69.14` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.14)

### Supavisor
- Updated to `v2.7.3` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.3)

---

## [2025-10-13]

### Analytics (Logflare)
- Updated to `v1.22.6` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.22.6)

---

## [2025-10-08]

### Studio
- Updated to `2025.10.01-sha-8460121` - [Dashboard updates](https://github.com/orgs/supabase/discussions/39709)
- Added "local" remote MCP server - PR [#38797](https://github.com/supabase/supabase/pull/38797), PR [#39041](https://github.com/supabase/supabase/pull/39041)
- ⚠️ Changed Studio connection method to `postgres-meta` - affects non-standard database port configurations

### Auth
- Updated to `v2.180.0` - [Release](https://github.com/supabase/auth/releases/tag/v2.180.0)

### PostgREST
- Updated to `v13.0.7` - [Release](https://github.com/PostgREST/postgrest/releases/tag/v13.0.7) | [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md)

### Realtime
- Updated to `v2.51.11` - [Release](https://github.com/supabase/realtime/releases/tag/v2.51.11)

### Storage
- Updated to `v1.28.0` - [Release](https://github.com/supabase/storage/releases/tag/v1.28.0)

### Postgres Meta
- Updated to `v0.91.6` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.91.6)

### Analytics (Logflare)
- Updated to `v1.22.4` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.22.4)

### Postgres
- Updated to `15.8.1.085` - [Release](https://github.com/supabase/postgres/releases/tag/15.8.1.085)

### Supavisor
- Updated to `2.7.0` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.0)

---
