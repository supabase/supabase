# Testagram Core Backend

This directory defines the first Testagram-owned backend platform layer built from the open-source Supabase stack.

## Goal

Keep one Testagram repository while preserving service boundaries:

- PostgreSQL
- Auth / GoTrue
- PostgREST
- Realtime
- Storage
- Edge Runtime
- Supavisor
- postgres-meta
- Studio / control-plane integration

We do **not** flatten these services into one process. They remain independently buildable and deployable.

## Upstream sources

See `core/sources.json` for the upstream repositories and integration paths.

## Import strategy

Use `scripts/import-supabase-core.sh` to vendor upstream source with Git subtree. This keeps each component isolated under `core/services/<name>` and records a reproducible upstream source snapshot. The current `--squash` import does not preserve the complete upstream commit history.

Before importing or redistributing a component, preserve its upstream LICENSE/NOTICE files and verify its current license. The top-level Apache-2.0 license in this repository does not automatically relicense third-party components.

## Testagram ownership boundary

The Testagram layer will own deployment/control-plane configuration, domain/API routing, project provisioning, Testagram-specific database migrations, media/CDN orchestration, observability, backups and application contracts.

Upstream services should remain as close to upstream as practical until a concrete Testagram requirement justifies a modification.
