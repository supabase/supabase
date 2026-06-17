# Changelog

All notable changes to the Supabase self-hosted Docker configuration.

Changes are grouped by service rather than by change type. See [versions.md](./versions.md) for complete image version history and rollback information.

See per-service updates below for details. Only the most important changes relevant to [self-hosted Supabase](https://supabase.com/docs/guides/self-hosting) are included here. For the full list of changes, refer to the release notes and changelogs of each individual service.

**Note:** Configuration updates marked with "requires [...] update" are already included in the latest version of the repository. Pull the latest changes or refer to the linked PR for manual updates. After updating `docker-compose.yml`, pull the latest images and recreate containers - use `docker compose pull && docker compose down && docker compose up -d`.

---

## Unreleased

⚠️ **Upcoming changes:** Check the main Supabase [changelog](https://github.com/orgs/supabase/discussions/categories/changelog?discussions_q=is%3Aopen+category%3AChangelog+label%3Aself-hosted) for updates.

---

## [2026-06-17]

⚠️ **Note:** This update contains **breaking changes**. Make sure to read the **important** details below:
- **Postgres 17 is now the default**. Do not start Postgres 17 on an existing Postgres 15 data directory. See the [Upgrade to Postgres 17](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17) guide. Check the **Configuration** and **Postgres** sections for additional information
- API gateway configuration includes a **security fix** for Realtime routes - it is **strongly recommended** to add this update to any self-hosted Supabase instance running Realtime
- Studio and Postgres Meta configuration now use `postgres` and not `supabase_admin` to connect to Postgres

### Configuration
- ⚠️ Changed the default Postgres image to `supabase/postgres:17.6.1.136` - PR [#46981](https://github.com/supabase/supabase/pull/46981)
- ⚠️ Added `docker-compose.pg15.yml` - for deployments not yet upgraded, and as the rollback target for `utils/upgrade-pg17.sh` - PR [#46981](https://github.com/supabase/supabase/pull/46981)
- Updated `docker-compose.pg17.yml` to match the new default - PR [#46981](https://github.com/supabase/supabase/pull/46981)

### Documentation
- Updated the [Upgrade to Postgres 17](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17) how-to - PR [#46989](https://github.com/supabase/supabase/pull/46989)
- Updated the [New API Keys](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys) and [Envoy API Gateway](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy) how-to guides - PR [#46856](https://github.com/supabase/supabase/pull/46856)
- Updated [CONFIG.md](CONFIG.md) - PR [#47022](https://github.com/supabase/supabase/pull/47022)

### Utils and tests
- Updated `utils/upgrade-pg17.sh` (bumped Postgres image, added additional migrations), and `tests/test-pg17-upgrade.sh` (added tests for pg_cron) - PR [#46981](https://github.com/supabase/supabase/pull/46981)
- Updated `tests/test-self-hosted.sh` (added tests for resumable upload, modified tests for Realtime and GraphQL) - PR [#46731](https://github.com/supabase/supabase/pull/46731), PR [#46856](https://github.com/supabase/supabase/pull/46856), PR [#46981](https://github.com/supabase/supabase/pull/46981)
- Updated `tests/test-auth-keys.sh` (modified tests for Realtime) - PR [#46856](https://github.com/supabase/supabase/pull/46856)

### API gateway
- ⚠️ Updated Kong and Envoy configuration to block access to Realtime `/api/tenants` and `/api/openapi` endpoints. This is a **security fix** (requires `volumes/api/kong.yml` and `volumes/api/envoy` update) - PR [#46856](https://github.com/supabase/supabase/pull/46856)
- Updated entrypoint for Kong to use `/bin/sh` (requires `docker-compose.yml` update) - PR [#46873](https://github.com/supabase/supabase/pull/46873)

### Studio
- ⚠️ Updated `studio` configuration to use `postgres` instead of `supabase_admin` to connect to Postgres (requires `docker-compose.yml` update). See discussion [#46081](https://github.com/orgs/supabase/discussions/46081) and the [how-to guide](https://supabase.com/docs/guides/self-hosting/remove-superuser-access) for important information - PR [#47022](https://github.com/supabase/supabase/pull/47022)

### PostgREST
- Added healthcheck for `rest` (requires `docker-compose.yml` update) - PR [#46658](https://github.com/supabase/supabase/pull/46658)

### Postgres Meta
- ⚠️ Updated `meta` configuration to use `postgres` instead of `supabase_admin` to connect to Postgres (requires `docker-compose.yml` update) - PR [#47022](https://github.com/supabase/supabase/pull/47022)

### Edge Runtime
- Added healthcheck for `functions` (requires `docker-compose.yml` update) - PR [#46655](https://github.com/supabase/supabase/pull/46655)

### Postgres
- ⚠️ Updated the default image to `17.6.1.136` (from `15.8.1.085`). `pg_graphql` is now **disabled by default** on fresh installs. Databases that already use GraphQL keep it after an upgrade. See discussion [#46080](https://github.com/orgs/supabase/discussions/46080) and the [how-to guide](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17) for more information - PR [#46981](https://github.com/supabase/supabase/pull/46981)

---

## [2026-06-03]

⚠️ **Note:** This update includes **important changes**. Please check the details below.

### Configuration
- ⚠️ Logs and analytics are now [optional](https://github.com/orgs/supabase/discussions/46084) and were removed from the default `docker-compose.yml`. A new `docker-compose.logs.yml` override has been added. Check the main [configuration guide](https://supabase.com/docs/guides/self-hosting/docker#enabling-analytics) and the changes to Studio below for more information - PR [#45327](https://github.com/supabase/supabase/pull/45327) (via [@luizfelmach](https://github.com/luizfelmach/))
- ⚠️ Added `COMPOSE_FILE` to `.env.example` for configuring compose overrides (also used by `run.sh`) - PR [#45603](https://github.com/supabase/supabase/pull/45603)

### Documentation
- Added a new [reference list](https://github.com/supabase/supabase/blob/master/docker/CONFIG.md) of all configuration environment variables - PR [#46124](https://github.com/supabase/supabase/pull/46124)
- Updated the main installation and configuration [guide](https://supabase.com/docs/guides/self-hosting/docker) (added "quick start" path and opt-in for logs and analytics; removed the legacy JWT secrets generator) - PR [#46416](https://github.com/supabase/supabase/pull/46416), PR [#45359](https://github.com/supabase/supabase/pull/45359)
- Updated the logs and analytics [how-to guide](https://supabase.com/docs/reference/self-hosting-analytics/introduction) - PR [#46452](https://github.com/supabase/supabase/pull/46452)

### Utils
- Added `setup.sh` and `run.sh` to support quick start and easier management of the compose configuration - PR [#45603](https://github.com/supabase/supabase/pull/45603)
- Updated `utils/add-new-auth-keys.sh` and `utils/rotate-new-api-key.sh` to remove the dependency on OpenSSL and Node.js - PR [#45941](https://github.com/supabase/supabase/pull/45941)
- Updated `tests/test-container-logs.sh` to skip checks for `kong`, `analytics` and `vector` when the services are not running - PR [#46099](https://github.com/supabase/supabase/pull/46099)

### API gateway
- Updated Envoy version to `1.38.0` (see `docker-compose.envoy.yml`) - PR [#46023](https://github.com/supabase/supabase/pull/46023)
- Updated Envoy configuration to address a discrepancy in API key checking (requires `volumes/api/envoy` update) - PR [#46023](https://github.com/supabase/supabase/pull/46023)

### Studio
- Updated to `2026.06.03-sha-0bca601`
- ⚠️ Added `ENABLED_FEATURES_LOGS_ALL` to Studio service configuration (requires `docker-compose.yml` update) - PR [#45327](https://github.com/supabase/supabase/pull/45327)
- ⚠️ Added `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` to Studio service configuration (requires `docker-compose.yml` update) - PR [#46173](https://github.com/supabase/supabase/pull/46173)
- ⚠️ Added `start_period` to Studio healthcheck for more reliable cold-boot on slower hosts (requires `docker-compose.yml` update) - PR [#45327](https://github.com/supabase/supabase/pull/45327)
- Fixed incorrect connection strings in the connect sheet for self-hosted environments - PR [#46217](https://github.com/supabase/supabase/pull/46217)
- Updated project home and functions page, and added a minimal project settings implementation - PR [#46544](https://github.com/supabase/supabase/pull/46544), PR [#46550](https://github.com/supabase/supabase/pull/46550), PR [#46554](https://github.com/supabase/supabase/pull/46554)

### Auth
- Updated to `v2.189.0` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md) | [Release](https://github.com/supabase/auth/releases/tag/v2.189.0)
- ⚠️ Added `GOTRUE_JWT_ISSUER` to Auth service configuration (requires `docker-compose.yml` update) - PR [#46020](https://github.com/supabase/supabase/pull/46020)

### PostgREST
- Updated to `v14.12` - [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md) | [Release](https://github.com/PostgREST/postgrest/releases/tag/v14.12)

### Realtime
- Updated to `v2.102.3` - [Release](https://github.com/supabase/realtime/releases/tag/v2.102.3)

### Storage
- Updated to `v1.60.4` - [Release](https://github.com/supabase/storage/releases/tag/v1.60.4)

### Postgres Meta
- Updated to `v0.96.6` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.96.6)

### Edge Runtime
- Updated to `v1.74.0` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.74.0)

### Supavisor
- Updated to `2.9.5` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.9.5)
- Added `POSTGRES_HOST` to Supavisor service configuration (requires `docker-compose.yml` and `volumes/pooler/pooler.exs` update) - PR [#41273](https://github.com/supabase/supabase/pull/41273)

### Analytics (Logflare)
- Updated to `1.43.1` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.43.1)
- ⚠️ Changed default `docker-compose.yml` to no longer include logs & analytics. Read more in Supabase's [changelog](https://github.com/orgs/supabase/discussions/46084) - PR [#45327](https://github.com/supabase/supabase/pull/45327)

---

## [2026-04-27]

### Configuration
- ⚠️ Added `docker-compose.envoy.yml` and `volumes/api/envoy`. See also the API gateway updates below - PR [#43838](https://github.com/supabase/supabase/pull/43838)
- ⚠️ Changed Studio healthcheck and some other configuration for better compatibility with Podman (requires `docker-compose.yml` update) - PR [#44754](https://github.com/supabase/supabase/pull/44754)
- ⚠️ Changed Studio configuration to bind to all IPv4 interfaces only (requires `docker-compose.yml` update) - PR [#44772](https://github.com/supabase/supabase/pull/44772)

### Documentation
- Added a new [how-to](https://supabase.com/docs/guides/self-hosting/remove-superuser-access) describing how to switch from `supabase_admin` to `postgres` role for Studio - PR [#42975](https://github.com/supabase/supabase/pull/42975) (via [@singh-inder](https://github.com/singh-inder/))
- Added a new [how-to](https://github.com/supabase/supabase/pull/45152) for configuring Envoy as the new API gateway - PR [#45152](https://github.com/supabase/supabase/pull/45152)
- Updated the main [setup guide](https://supabase.com/docs/guides/self-hosting/docker) and the how-tos to reflect the state of the self-hosted Supabase configuration - PR [#45011](https://github.com/supabase/supabase/pull/45011)

### Utils
- ⚠️ Added `utils/reassign-owner.sh` to update database objects. Read more in the "[Remove superuser access](https://supabase.com/docs/guides/self-hosting/remove-superuser-access)" how-to guide - PR [#42975](https://github.com/supabase/supabase/pull/42975)
- ⚠️ Changed `utils/add-new-auth-keys.sh` to also update `docker-compose.yml` - PR [#45056](https://github.com/supabase/supabase/pull/45056)

### API gateway
- ⚠️ Added Envoy as the new optional API gateway (requires `docker-compose.envoy.yml`, `volumes/api/envoy`, and `volumes/logs/vector.yml` update) - PR [#43838](https://github.com/supabase/supabase/pull/43838) (via [@luizfelmach](https://github.com/luizfelmach/))

### Studio
- Updated to `2026.04.27-sha-5f60601`
- ⚠️ Added 4 new lints to the Security Advisor. Read more about lint rules 0026 - 0029 in the [Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0026_pg_graphql_anon_table_exposed) section of the Supabase documentation - PR [#45253](https://github.com/supabase/supabase/pull/45253), PR [#45260](https://github.com/supabase/supabase/pull/45260)
---

## [2026-04-08]

### Documentation
- Added new how-to guides for configuring [custom email templates](https://supabase.com/docs/guides/self-hosting/custom-email-templates), setting up [SAML SSO](https://supabase.com/docs/guides/self-hosting/self-hosted-saml-sso), and [using Postgres 17](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17) - PR [#42832](https://github.com/supabase/supabase/pull/42832), PR [#43386](https://github.com/supabase/supabase/pull/43386), PR [#44147](https://github.com/supabase/supabase/pull/44147)

### Utils
- ⚠️ Added `utils/upgrade-pg17.sh`. Read more in the "[Upgrade to Postgres 17](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17)" how-to guide - PR [#44147](https://github.com/supabase/supabase/pull/44147)

### API gateway
- ⚠️ Added configuration for SAML SSO (requires `.env`, `docker-compose.yml` and `volumes/api/kong.yml` update) - PR [#43385](https://github.com/supabase/supabase/pull/43385) (via [@luizfelmach](https://github.com/luizfelmach/))

### Studio
- Updated to `2026.04.08-sha-205cbe7`

### PostgREST
- Updated to `v14.8` - [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md) | [Release](https://github.com/PostgREST/postgrest/releases/tag/v14.8)

### Storage
- Updated to `v1.48.26` - [Release](https://github.com/supabase/storage/releases/tag/v1.48.26)

### imgproxy
- Changed `IMGPROXY_ENABLE_WEBP_DETECTION` environment variable to `IMGPROXY_AUTO_WEBP` (requires `.env` and `docker-compose.yml` update) - PR [#43919](https://github.com/supabase/supabase/pull/43919)

### Postgres Meta
- Updated to `v0.96.3` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.96.3)

### Analytics (Logflare)
- Updated to `1.36.1` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.36.1)

### Postgres
- ⚠️ Added `docker-compose.pg17.yml` override - PR [#44147](https://github.com/supabase/supabase/pull/44147)
- ⚠️ Added `utils/upgrade-pg17.sh` - PR [#44147](https://github.com/supabase/supabase/pull/44147)
- ⚠️ Added [documentation](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17) explaining the upgrade to Postgres 17

---

## [2026-03-16]

⚠️ **Note:** This update includes **important changes**. Please check the details below. The following configuration files have been added/updated: `utils/add-new-auth-keys.sh`, `utils/rotate-new-api-keys.sh`, `docker-compose.yml`, `.env.example`, `docker-compose.s3.yml`, `docker-compose.rustfs.yml`, `volumes/api/kong.yml`, `volumes/api/kong-entrypoint.sh`, `docker-compose.caddy.yml`, `docker-compose.nginx.yml`, `volumes/functions/main/index.ts`, and `volumes/proxy`.

### Configuration
- ⚠️ Added scripts and templates to support the new API key format (`sb_` API keys) and the new asymmetric authentication. Check the [how-to guide](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys) for detailed instructions - PR [#43554](https://github.com/supabase/supabase/pull/43554)
- Added optional proxy configuration for Caddy and nginx. Read the [how-to guide](https://supabase.com/docs/guides/self-hosting/self-hosted-proxy-https) to learn more - PR [#43291](https://github.com/supabase/supabase/pull/43291)

### Documentation
- Added several new how-to guides to the self-hosted Supabase [documentation](https://supabase.com/docs/guides/self-hosting) - PR [#42745](https://github.com/supabase/supabase/pull/42745), PR [#42953](https://github.com/supabase/supabase/pull/42953), PR [#43177](https://github.com/supabase/supabase/pull/43177), PR [#43286](https://github.com/supabase/supabase/pull/43286), PR [#43293](https://github.com/supabase/supabase/pull/43293)

### Utils and tests
- Added `utils/add-new-auth-keys.sh` and `utils/rotate-new-api-keys.sh` - PR [#43554](https://github.com/supabase/supabase/pull/43554)
- Added `tests/` with 100+ test cases - PR [#43573](https://github.com/supabase/supabase/pull/43573)

### Studio
- Updated to `2026.03.16-sha-5528817`
- ⚠️ Added the link to the Data API page in Integrations - PR [#43268](https://github.com/supabase/supabase/pull/43268)
- ⚠️ Added `PGRST_DB_SCHEMAS`, `PGRST_DB_EXTRA_SEARCH_PATH`, and `PGRST_DB_MAX_ROWS` to Studio configuration (requires `docker-compose.yml` update) - PR [#43268](https://github.com/supabase/supabase/pull/43268)

### MCP Server
- Updated to `v0.7.0` - [Release](https://github.com/supabase/mcp/releases/tag/v0.7.0)

### API gateway
- ⚠️ Updated Kong to `3.9.1` - PR [#43554](https://github.com/supabase/supabase/pull/43554)

### PostgREST
- Updated to `v14.6` - [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md) | [Release](https://github.com/PostgREST/postgrest/releases/tag/v14.6)

### Realtime
- ⚠️ Added **mandatory** `METRICS_JWT_SECRET` environment variable (requires `docker-compose.s3.yml` update) - PR [realtime#1729](https://github.com/supabase/realtime/pull/1729)

### Storage
- Updated to `v1.44.2` - [Release](https://github.com/supabase/storage/releases/tag/v1.44.2)
- ⚠️ Added `STORAGE_PUBLIC_URL` environment variable to simplify proxy configuration (requires `docker-compose.s3.yml` update) - PR [storage#900](https://github.com/supabase/storage/pull/900)
- ⚠️ Added RustFS as an optional S3 backend - PR [#42935](https://github.com/supabase/supabase/pull/42935)
- ⚠️ Changed Docker Compose configuration for S3 backends to use named volumes - PR [#43815](https://github.com/supabase/supabase/pull/43815)

### Edge Runtime
- Updated to `v1.71.2` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.71.2)
- ⚠️ Added `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, and `SUPABASE_PUBLIC_URL` environment variables (requires `docker-compose.yml` update)
- ⚠️ Added an option for a "hybrid" JWT verification following the addition of the new API keys and the new asymmetric authentication (requires `volumes/functions/main/index.ts` update) - PR [#42130](https://github.com/supabase/supabase/pull/42130)
- ⚠️ Added optional rate limiter - PR [edge-runtime#670](https://github.com/supabase/edge-runtime/pull/670)

---

## [2026-02-18]

### Storage
- Changed MinIO image to use Chainguard [minio](https://images.chainguard.dev/directory/image/minio/overview) and [minio-client](https://images.chainguard.dev/directory/image/minio-client/overview) (requires `docker-compose.s3.yml` update) - PR [#42942](https://github.com/supabase/supabase/pull/42942)
- Updated Storage image version to `v1.37.8` in `docker-compose.s3.yml`
- Removed `imgproxy` service from `docker-compose.s3.yml` to minimize redundancy - PR [#42942](https://github.com/supabase/supabase/pull/42942)
- Fixed inconsistent `storage` service entry ordering in `docker-compose.yml` and `docker-compose.s3.yml` to improve diff readability - PR [#42942](https://github.com/supabase/supabase/pull/42942)

### Edge Runtime
- Added a `deno-cache` named volume to avoid re-downloading dependencies (requires `docker-compose.yml` and `volumes/functions/*` update) - PR [#40822](https://github.com/supabase/supabase/pull/40822)

---

## [2026-02-16]

⚠️ **Note:** This update includes several breaking changes, including a security fix for Analytics. Please check the details below. The following configuration files have been updated: `docker-compose.yml`, `.env.example`, `docker-compose.s3.yml`, `volumes/api/kong.yml`, and `volumes/logs/vector.yml`.

### Studio
- Updated to `2026.02.16-sha-26c615c`
- Added Edge Functions management UI (requires `docker-compose.yml` update) - PR [#40690](https://github.com/supabase/supabase/pull/40690), PR [#42322](https://github.com/supabase/supabase/pull/42322), PR [#42349](https://github.com/supabase/supabase/pull/42349), PR [#42350](https://github.com/supabase/supabase/pull/42350)

### MCP Server
- Updated to `v0.6.3` - [Release](https://github.com/supabase/mcp/releases/tag/v0.6.3)

### Auth
- Updated to `v2.186.0` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md) | [Release](https://github.com/supabase/auth/releases/tag/v2.186.0)

### PostgREST
- Updated to `v14.5` - [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md) | [Release](https://github.com/PostgREST/postgrest/releases/tag/v14.5)

### Realtime
- Updated to `v2.76.5` - [Release](https://github.com/supabase/realtime/releases/tag/v2.76.5)

### Storage
- Updated to `v1.37.8` - [Release](https://github.com/supabase/storage/releases/tag/v1.37.8)
- ⚠️ Changed environment variable configuration for Storage (requires `docker-compose.yml`, `.env.example` and `.env` update) - PR [#37185](https://github.com/supabase/supabase/pull/37185), PR [#42862](https://github.com/supabase/supabase/pull/42862)
- ⚠️ Added **default** configuration to access buckets via `/storage/v1/s3` endpoint (requires `docker-compose.yml` and `.env` update) - PR [#37185](https://github.com/supabase/supabase/pull/37185)
- ⚠️ Changed MinIO configuration for the S3 backend (requires `docker-compose.s3.yml` and `.env` update) - PR [#37185](https://github.com/supabase/supabase/pull/37185)

### Edge Runtime
- Updated to `v1.70.3` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.70.3)

### Analytics (Logflare)
- Updated to `1.31.2` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.31.2)
- ⚠️ Changed default configuration to disable Logflare on `0.0.0.0:4000` to prevent access to `/dashboard` (requires `docker-compose.yml` update). Read more in the "Production Recommendations" section of Logflare [documentation](https://supabase.com/docs/reference/self-hosting-analytics/introduction) - PR [#42857](https://github.com/supabase/supabase/pull/42857)
- ⚠️ Changed Kong routes to not include `/analytics/v1` by default (requires `/volumes/api/kong.yml` update) - PR [#42857](https://github.com/supabase/supabase/pull/42857)

### Vector
- Updated to `0.53.0-alpine` - [Changelog](https://vector.dev/releases/0.53.0/) | [Release](https://github.com/vectordotdev/vector/releases/tag/v0.53.0)
- ⚠️ Major version jump from `0.28.1` (requires `volumes/logs/vector.yml` update) - PR [#42525](https://github.com/supabase/supabase/pull/42525)
- ⚠️ Changed Postgres sink configuration to bypass Kong (requires `volumes/logs/vector.yml` update) - PR [#42857](https://github.com/supabase/supabase/pull/42857)
- ⚠️ Changed retry settings for all sinks to increase timeouts (requires `volumes/logs/vector.yml` update) - PR [#42857](https://github.com/supabase/supabase/pull/42857)

---

## [2026-02-05]

### Storage
- Updated to `v1.37.1` - [Release](https://github.com/supabase/storage/releases/tag/v1.37.1)
- Fixed an issue with Storage not starting because of an issue with migrations - PR [storage#845](https://github.com/supabase/storage/pull/845)

---

## [2026-01-27]

### Studio
- Updated to `2026.01.27-sha-6aa59ff`
- Added SQL snippets (requires `docker-compose.yml` update) - PR [#41112](https://github.com/supabase/supabase/pull/41112), PR [#41557](https://github.com/supabase/supabase/pull/41557), discussion [#42031](https://github.com/orgs/supabase/discussions/42031)
- Fixed type generator - PR [#40481](https://github.com/supabase/supabase/pull/40481)
- Fixed minor UI discrepancies - PR [#40579](https://github.com/supabase/supabase/pull/40579), PR [#41936](https://github.com/supabase/supabase/pull/41936), PR [#41970](https://github.com/supabase/supabase/pull/41970), PR [#41971](https://github.com/supabase/supabase/pull/41971), PR [#41972](https://github.com/supabase/supabase/pull/41972), PR [#42015](https://github.com/supabase/supabase/pull/42015)

### Auth
- Updated to `v2.185.0` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md) | [Release](https://github.com/supabase/auth/releases/tag/v2.185.0)
- ⚠️ Fixed security-related issues

### PostgREST
- Updated to `v14.3` - [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md) | [Release](https://github.com/PostgREST/postgrest/releases/tag/v14.3)

### Realtime
- Updated to `v2.72.0` - [Release](https://github.com/supabase/realtime/releases/tag/v2.72.0)
- Changed healthchecks logging to off by default (requires `docker-compose.yml` update) - PR [realtime#1677](https://github.com/supabase/realtime/pull/1677), PR [#42156](https://github.com/supabase/supabase/pull/42156)
- Changed logging configuration and healthcheck frequency to reduce log volume (requires `docker-compose.yml` update) - PR [#42112](https://github.com/supabase/supabase/pull/42112)

### Storage
- Updated to `v1.33.5` - [Release](https://github.com/supabase/storage/releases/tag/v1.33.5)

### imgproxy
- Updated to `v3.30.1` - [Changelog](https://github.com/imgproxy/imgproxy/blob/master/CHANGELOG.md) | [Release](https://github.com/imgproxy/imgproxy/releases/tag/v3.30.1)

### Postgres Meta
- Updated to `v0.95.2` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.95.2)

### Edge Runtime
- Updated to `v1.70.0` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.70.0)

### Analytics (Logflare)
- Updated to `1.30.3` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.30.3)

### Postgres
- No image update
- Fixed Postgres logging configuration (requires `volumes/logs/vector.yml` update) - PR [#41800](https://github.com/supabase/supabase/pull/41800)

---

## [2025-12-18]

### Documentation
- Updated self-hosting installation and configuration guide - PR [#40901](https://github.com/supabase/supabase/pull/40901), PR [#41438](https://github.com/supabase/supabase/pull/41438)

### Utils
- Added `utils/generate-keys.sh` - PR [#41363](https://github.com/supabase/supabase/pull/41363)
- Added `utils/db-passwd.sh` - PR [#41432](https://github.com/supabase/supabase/pull/41432)
- Changed `reset.sh` to POSIX and added more checks - PR [#41361](https://github.com/supabase/supabase/pull/41361)

### Studio
- Updated to `2025.12.17-sha-43f4f7f`
- ⚠️ Fixed additional issues related to [React2Shell](https://vercel.com/kb/bulletin/react2shell)
- Fixed an issue with the Users page not being updated on changes - PR [#41254](https://github.com/supabase/supabase/pull/41254)

### MCP Server
- Updated to `v0.5.10` - [Release](https://github.com/supabase/mcp/releases/tag/v0.5.10)

### Auth
- Updated to `v2.184.0` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md) | [Release](https://github.com/supabase/auth/releases/tag/v2.184.0)

### Postgres Meta
- Updated to `v0.95.1` - [Release](https://github.com/supabase/postgres-meta/releases/tag/v0.95.1)

### Analytics (Logflare)
- Updated to `1.27.0` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.27.0)
- Fixed multiple issues, including a race condition

---

## [2025-12-10]

### Studio
- Updated to `2025.12.09-sha-434634f`
- ⚠️ Fixed security issues related to [React2Shell](https://vercel.com/kb/bulletin/react2shell)

### MCP Server
- Updated to `v0.5.9` - [Release](https://github.com/supabase/mcp/releases/tag/v0.5.9)
- ⚠️ Changed MCP tool `get_anon_key` to `get_publishable_keys`

### PostgREST
- Updated to `v14.1` - [Changelog](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md) | [Release](https://github.com/PostgREST/postgrest/releases/tag/v14.1)
- ⚠️ **Major upgrade from v13.x to v14.x** - please report any unexpected behavior

### Realtime
- Updated to `v2.68.0` - [Release](https://github.com/supabase/realtime/releases/tag/v2.68.0)

### Storage
- Updated to `v1.33.0` - [Release](https://github.com/supabase/storage/releases/tag/v1.33.0)

### Edge Runtime
- Updated to `v1.69.28` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.28)

### Analytics (Logflare)
- Updated to `1.26.25` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.26.25)

---

## [2025-12-08]

### Realtime
- No image update
- Changed boolean values to strings in Docker Compose for better compatibility with Podman - PR [#40994](https://github.com/supabase/supabase/pull/40994), also PR [realtime#1614](https://github.com/supabase/realtime/pull/1614)
- Changed healthcheck in Docker Compose for better compatibility with Podman - PR [#41159](https://github.com/supabase/supabase/pull/41159)

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
- Updated to `1.26.13` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.26.13)
- Fixed crashdump when `POSTGRES_BACKEND_URL` is malformed - PR [logflare#2954](https://github.com/Logflare/logflare/pull/2954)

---

## [2025-11-25]

### Studio
- Updated to `2025.11.24-sha-d990ae8` - [Dashboard updates](https://github.com/orgs/supabase/discussions/40734)
- Fixed Queues configuration UI and added [documentation for exposed queue schema](https://supabase.com/docs/guides/queues/expose-self-hosted-queues) - PR [#40078](https://github.com/supabase/supabase/pull/40078)
- Fixed parameterized SQL queries in MCP tools - PR [#40499](https://github.com/supabase/supabase/pull/40499)
- Fixed Studio showing paid options for log drains - PR [#40510](https://github.com/supabase/supabase/pull/40510)
- Fixed AI Assistant authentication - PR [#40654](https://github.com/supabase/supabase/pull/40654)

### Auth
- Updated to `v2.183.0` - [Changelog](https://github.com/supabase/auth/blob/master/CHANGELOG.md) | [Release](https://github.com/supabase/auth/releases/tag/v2.183.0)

### Realtime
- Updated to `v2.65.2` - [Release](https://github.com/supabase/realtime/releases/tag/v2.65.2)
- Fixed handling of boolean configuration options - PR [realtime#1614](https://github.com/supabase/realtime/pull/1614)

### Storage
- Updated to `v1.32.0` - [Release](https://github.com/supabase/storage/releases/tag/v1.32.0)

### Edge Runtime
- Updated to `v1.69.25` - [Release](https://github.com/supabase/edge-runtime/releases/tag/v1.69.25)

### Analytics (Logflare)
- Updated to `1.26.12` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.26.12)
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
- Updated to `2.7.4` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.4)

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
- Updated to `2.7.3` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.3)

---

## [2025-10-13]

### Analytics (Logflare)
- Updated to `1.22.6` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.22.6)

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
- Updated to `1.22.4` - [Release](https://github.com/Logflare/logflare/releases/tag/v1.22.4)

### Postgres
- Updated to `15.8.1.085` - [Release](https://github.com/supabase/postgres/releases/tag/15.8.1.085)

### Supavisor
- Updated to `2.7.0` - [Release](https://github.com/supabase/supavisor/releases/tag/v2.7.0)

---
