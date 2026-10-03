# Testagram Core Forensic Audit

**Audit basis:** branch `testagram/core-platform-foundation`, imported-core commit `60e90ec5fff2fd067f7ba8a50babe04708e864d6`.

## Executive finding

The repository now contains the intended eight independently imported backend service trees, but it is **not yet a Testagram-owned runtime**. The highest-risk boundary is the deployment layer: the self-hosted Compose configuration still launches upstream container images, and the local Supabase configuration contains a hard-coded remote production project reference.

This audit intentionally separates **observed facts** from planned remediation. No upstream service implementation has been modified.

## Observed architecture

| Layer | Observed state | Status |
|---|---|---|
| PostgreSQL source | Imported under `core/services/postgres` | Present |
| Auth source | Imported under `core/services/auth` | Present |
| PostgREST source | Imported under `core/services/postgrest` | Present |
| Realtime source | Imported under `core/services/realtime` | Present |
| Storage source | Imported under `core/services/storage` | Present |
| Edge Runtime source | Imported under `core/services/edge-runtime` | Present |
| Supavisor source | Imported under `core/services/supavisor` | Present |
| postgres-meta source | Imported under `core/services/postgres-meta` | Present |
| Studio/platform | Existing upstream Studio tree under `apps/studio` | Present |
| API gateway | Envoy configuration under `docker/volumes/api/envoy` | Present |
| Database bootstrap | `docker/volumes/db` scripts and persistent data mounts | Present |
| Storage | File backend plus S3 override | Present |
| TLS | Caddy and Nginx overrides | Present |

## Finding F-001 — runtime images are still upstream-owned

`docker/docker-compose.yml` currently references upstream images including:

- `supabase/studio`
- `supabase/gotrue`
- `postgrest/postgrest`
- `supabase/realtime`
- `supabase/storage-api`
- `supabase/postgres-meta`
- `supabase/edge-runtime`
- `supabase/postgres`

The logs/analytics override additionally references `supabase/logflare`.

**Impact:** source ownership and runtime ownership are currently different. A Testagram deployment could execute an image that was not built from the source committed to this repository.

**Remediation:** introduce reproducible Testagram image builds and replace image references only after each service's Docker/build contract is verified.

## Finding F-002 — hard-coded Supabase Cloud project binding

`supabase/config.toml` contains:

`[remotes.prod]`

with a concrete `project_id`.

**Impact:** local repository configuration is coupled to a specific Supabase-hosted project. This is incompatible with a clean Testagram-owned control plane and is unnecessary for self-hosted runtime operation.

**Remediation:** remove the remote production binding and keep deployment/project configuration outside the source tree or in Testagram-owned configuration.

## Finding F-003 — upstream naming remains in the deployment identity

The Compose stack uses the project name `supabase`, container names such as `supabase-auth`, `supabase-db`, and Envoy node identifiers such as `supabase_cluster`.

**Impact:** this is primarily an ownership/operational clarity issue, but it becomes significant for monitoring, incident response, service discovery and multi-stack operation.

**Remediation:** rename externally visible Testagram-owned identities in a compatibility-aware pass. Do not rename internal service DNS names until all references are mapped.

## Finding F-004 — credentials contain development defaults

The checked-in `docker/.env.example` contains deliberately insecure/example values, including the dashboard password and development credentials.

**Impact:** the file is explicitly an example, so this is not itself a secret leak. However, deployment automation must guarantee that example/default credentials can never become production credentials.

**Remediation:** add CI checks that reject production manifests containing known placeholders/defaults and document secret injection.

## Finding F-005 — gateway has intentionally broad CORS

The Envoy listener currently permits all origins and all methods/headers.

**Impact:** acceptable as a self-hosting development default, but unsafe as an unreviewed production policy for Testagram.

**Remediation:** introduce environment-driven allowed origins and verify websocket/CORS behavior before tightening.

## Finding F-006 — source import is reproducible only at run time, not permanently pinned

The importer now resolves each repository's advertised default branch. This correctly fixed the earlier `master` assumption, but default branches move.

**Impact:** rerunning the importer later can select a different upstream revision without a recorded source-lock change.

**Remediation:** maintain an explicit upstream lock manifest containing repository, branch/tag, exact commit SHA, import path and verification timestamp. Updates should be intentional and reviewable.

## Finding F-007 — documentation previously overstated subtree history

The importer uses `--squash`. That preserves an isolated source snapshot, not the complete upstream commit history.

**Remediation:** documentation has been corrected to describe snapshot semantics accurately. Whether Testagram later wants full upstream history is a separate repository-size/maintenance decision.

## Security boundary

The intended request path is:

`Client -> Testagram gateway -> Auth/PostgREST/Realtime/Storage/Functions -> PostgreSQL`

The audit does **not** yet claim that JWT verification, RLS, Realtime authorization or Storage policies are correct. Those require runtime integration tests against the actual database and service configuration.

## Remediation order

1. Remove hard-coded remote project coupling.
2. Add source-lock metadata.
3. Inventory every runtime image and Docker build contract.
4. Build Testagram-owned images in CI.
5. Add service health/readiness tests.
6. Test Auth -> JWT -> RLS -> PostgREST.
7. Test Realtime authorization.
8. Test Storage/RLS and media paths.
9. Test backup/restore.
10. Add a blocking no-cloud-dependency gate.

**Rule:** no finding is considered closed merely because a file was changed. Each remediation must be followed by CI verification and, where applicable, runtime/integration evidence.
