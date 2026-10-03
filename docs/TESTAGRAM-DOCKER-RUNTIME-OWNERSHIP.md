# Testagram Docker / Runtime Ownership Map

Snapshot: 2026-10-02
Branch: testagram/core-platform-foundation

## Executive finding

The eight imported core service source trees are present. The canonical Compose runtime still executes upstream-named images for the core control/data plane. Source custody is established; runtime-image custody is not yet established.

## Exact runtime image map

| Service | Current image | Local source/Dockerfile | Testagram target | Status |
|---|---|---|---|---|
| studio | supabase/studio:2026.09.07-sha-7996410 | existing apps/ tree; Dockerfile not yet proven | ghcr.io/trendyzima/testagram-studio | upstream runtime |
| api-gw | envoyproxy/envoy:v1.39.1 | docker/volumes/api/envoy config | keep pinned Envoy; Testagram owns config | mixed |
| auth | supabase/gotrue:v2.196.0 | core/services/auth/Dockerfile | ghcr.io/trendyzima/testagram-auth | local build ready |
| rest | postgrest/postgrest:v14.17 | core/services/postgrest; Dockerfile not proven | ghcr.io/trendyzima/testagram-postgrest | build contract required |
| realtime | supabase/realtime:v2.134.10 | core/services/realtime/Dockerfile | ghcr.io/trendyzima/testagram-realtime | local build ready |
| storage | supabase/storage-api:v1.74.0 | core/services/storage/Dockerfile | ghcr.io/trendyzima/testagram-storage | local build ready |
| imgproxy | darthsim/imgproxy:v3.31.4 | external | pinned upstream | infrastructure dependency |
| meta | supabase/postgres-meta:v0.99.0 | core/services/postgres-meta/Dockerfile | ghcr.io/trendyzima/testagram-postgres-meta | local build ready |
| functions | supabase/edge-runtime:v1.76.2 | core/services/edge-runtime/Dockerfile | ghcr.io/trendyzima/testagram-edge-runtime | local build ready |
| db | supabase/postgres:17.6.1.136 | core/services/postgres; conventional Dockerfile not proven | ghcr.io/trendyzima/testagram-postgres | image strategy required |
| supavisor | supabase/supavisor:2.9.12 | core/services/supavisor/Dockerfile | ghcr.io/trendyzima/testagram-supavisor | local build ready |

## Optional stacks

- analytics: supabase/logflare:1.50.10 — do not fork until necessity is proven.
- vector: timberio/vector:0.53.0-alpine — retain as pinned infrastructure.
- minio: cgr.dev/chainguard/minio — retain as infrastructure.
- minio-createbucket: cgr.dev/chainguard/minio-client:latest-dev — floating tag must be pinned.
- caddy: caddy:2 — floating tag must be pinned.
- nginx: jonasal/nginx-certbot:6.2.0-nginx1.31.5 — retain only where required.

## Dependency graph

External clients -> Caddy/Nginx -> Envoy :8000 -> Studio/Auth/REST/Realtime/Storage.
Studio -> Meta -> PostgreSQL.
Auth -> PostgreSQL.
REST -> PostgreSQL.
Realtime -> PostgreSQL.
Storage -> REST + PostgreSQL + Imgproxy.
Functions -> Envoy + PostgreSQL.
Supavisor -> PostgreSQL.

## Startup/health contracts

- Envoy waits for Studio health.
- Auth, REST, Realtime and Meta wait for PostgreSQL health.
- Storage waits for PostgreSQL, REST startup and Imgproxy startup.
- Functions waits for Envoy health.
- PostgreSQL uses pg_isready.

Replacement images must preserve these contracts.

## Persistent state

- PostgreSQL data: docker/volumes/db/data.
- PostgreSQL custom configuration/key material: db-config.
- Storage objects: docker/volumes/storage.
- S3 mode: minio-data.
- Edge functions: docker/volumes/functions.
- Deno cache: deno-cache.
- Envoy configuration: docker/volumes/api/envoy/.
- PostgreSQL bootstrap SQL initializes realtime, webhooks, roles, JWT, internal metadata, logs and pooler wiring.

## Environment authority

Database: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_PASSWORD.
Auth/JWT: JWT_SECRET, JWT_JWKS, JWT_EXPIRY, SECRET_KEY_BASE.
API identity: ANON_KEY, SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY.
Public URLs: SUPABASE_PUBLIC_URL, API_EXTERNAL_URL, SITE_URL.
SMTP: SMTP_*.
Storage/S3: GLOBAL_S3_BUCKET, S3_PROTOCOL_*, FILE_STORAGE_BACKEND_PATH.
Image processing: IMGPROXY_*.
Metadata encryption: PG_META_CRYPTO_KEY.
Realtime encryption: REALTIME_DB_ENC_KEY.
Pooling: POOLER_*.
Functions: FUNCTIONS_VERIFY_JWT.
Dashboard: DASHBOARD_USERNAME, DASHBOARD_PASSWORD.

Secrets are runtime inputs and must never be baked into image layers.

## Gateway route map

- /auth/v1/* -> auth
- /rest/v1/* -> rest
- /graphql/v1/* -> rest GraphQL
- /realtime/v1/* -> realtime WebSocket/API
- /storage/v1/* -> storage
- /functions/v1/* -> edge functions
- /pg/* -> postgres-meta
- /* -> Studio
- /mcp and /api/mcp are explicitly blocked.

## Forensic findings

1. Core runtime images are still upstream references. This is the main ownership gap.
2. Compose project/container identity still uses Supabase naming. Realtime also uses a Supabase-specific hostname. Do not mass-rename until aliases and tenant-id behavior are tested.
3. Envoy configuration is already Testagram-controlled; forking Envoy is not currently necessary.
4. Generic infrastructure images should not be forked merely for branding. Pin them and own their configuration.
5. minio-client:latest-dev and caddy:2 are not sufficiently reproducible for production.
6. The PostgreSQL upgrade helper previously contained a hard-coded Supabase reporting endpoint; it is now optional and Testagram-configurable.

## Ownership gate

A service becomes Testagram-owned only after controlled build inputs, reproducible image build, no credentials in layers, Testagram registry publication, immutable production digest, health/readiness verification, documented environment and volume contracts, and gateway/inter-service integration tests.

## Next operation

Do not mass-rewrite image names yet. First prove the build contracts for Auth, Realtime, Storage, Meta, Edge Runtime and Supavisor; then establish reproducible PostgREST, PostgreSQL and Studio image strategies. Build and smoke-test each image before changing Compose.
