# Testagram Core Architecture

## Current state

`Trendyzima/supabase-for-testagram` is a fork of the official `supabase/supabase` repository. The fork already contains the Supabase Studio/platform monorepo and Docker self-hosting configuration.

The current Docker stack still references upstream container images. That is normal for the starting point, but it is not yet an independently built Testagram backend.

## Target state

```text
                    TESTAGRAM CLOUD
                           |
                    Testagram Gateway
                           |
       +-------------------+-------------------+
       |          |          |        |        |
      Auth     PostgREST  Realtime  Storage  Functions
       |          |          |        |        |
       +----------+----------+--------+--------+
                           |
                       PostgreSQL
                           |
                       Supavisor
```

### Ownership layers

1. **Upstream-compatible core** — keep service implementations close to upstream.
2. **Testagram platform layer** — provisioning, routing, secrets, backups, observability and deployment.
3. **Testagram data layer** — application schemas, RLS policies, migrations and extensions.
4. **Testagram media layer** — object storage, image/video processing, thumbnails and CDN delivery.
5. **Client contracts** — stable Testagram API/auth/realtime/storage contracts for web and native clients.

## Important boundary

One Git repository does not mean one process. Each core service remains an independently deployable unit. This prevents a Realtime change from forcing a Storage restart and lets services scale independently.

## First import

Run:

```bash
bash scripts/import-supabase-core.sh
```

The operation can be large and should be performed on a workstation or CI runner with sufficient disk and network bandwidth.

After import:

```text
core/services/
  postgres/
  auth/
  postgrest/
  realtime/
  storage/
  edge-runtime/
  supavisor/
  postgres-meta/
```

The existing Studio/platform code remains under `apps/`.

## Next hardening stages

- Replace upstream image references with Testagram-built images.
- Pin every core component to a recorded upstream commit/tag.
- Add a reproducible multi-service build pipeline.
- Add SBOM and license/NOTICE collection.
- Add health/readiness checks for every service.
- Add integration tests covering Auth -> JWT -> RLS -> PostgREST.
- Add Realtime authorization tests.
- Add Storage/RLS/media tests.
- Add PostgreSQL backup/restore tests.
- Only then remove remaining Supabase Cloud assumptions.
