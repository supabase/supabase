# Changelog

All notable changes to the Supabase self-hosted Docker configuration.

Changes are grouped by service rather than by change type. See [versions.md](./versions.md) 
for complete image version history and rollback information.

Check updates, changelogs, and release notes for each service to learn more.

## Unreleased

## [2025-11-12]

### Studio
- Updated to `2025.11.10-sha-5291fe3` - [Dashboard updates](https://github.com/orgs/supabase/discussions/40083)
- Added log drains - [PR #28297](https://github.com/supabase/supabase/pull/28297)
- Fixed issue with Studio using `postgres` role instead of `supabase_admin` - [PR #39946](https://github.com/supabase/supabase/pull/39946)

### Auth
- Updated to `v2.182.1` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md#21821-2025-11-05) | [Release](https://github.com/supabase/auth/releases/tag/v2.182.1)

### Realtime
- Updated to `v2.63.0` - [Release](https://github.com/supabase/realtime/releases/tag/v2.63.0)

### Storage
- Updated to `v1.29.0` - [Release](https://github.com/supabase/storage/releases/tag/v1.29.0)

### Edge Runtime
- Updated to `v1.69.23` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.23)

### Supavisor
- Updated to `2.7.4` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.4)

---

## [2025-11-05]

### Studio
- Fixed issue with Studio failing to connect to Postgres with non-default settings - [PR #40169](https://github.com/supabase/supabase/pull/40169)

### Realtime
- Fixed issue with realtime logs not showing in Studio - [PR #39963](https://github.com/supabase/supabase/pull/39963)

---

## [2025-10-28]

### Studio
- Updated to `2025.10.27-sha-85b84e0` - [Dashboard updates](https://github.com/orgs/supabase/discussions/39709)
- Fixed broken authentication when uploading files to Storage - [PR #39829](https://github.com/supabase/supabase/pull/39829)

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
- Added additional Kong configuration for MCP server routes - [PR #39849](https://github.com/supabase/supabase/pull/39849)
- Added [documentation page](https://supabase.com/docs/guides/self-hosting/enable-mcp) describing MCP server configuration - [PR #39952](https://github.com/supabase/supabase/pull/39952)

---
