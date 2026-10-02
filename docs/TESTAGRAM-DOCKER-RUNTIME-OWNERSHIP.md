# Testagram Runtime Ownership & Docker Build Map

**Scope:** `testagram/core-platform-foundation`  
**Purpose:** distinguish source ownership, image ownership, runtime dependencies, and remaining upstream image dependencies before changing production behavior.

## Current runtime inventory

| Service | Compose role | Current image | Local Dockerfile | Build ownership now | Key dependencies | Persistent state |
|---|---|---|---|---|---|---|
| studio | Admin/control UI | `supabase/studio:2026.09.07-sha-7996410` | not yet established | Upstream image | meta, db/API credentials, gateway | snippets/functions mounts |
| api-gw | API ingress | `envoyproxy/envoy:v1.39.1` | custom config/entrypoint only | Mixed: upstream base + Testagram config | studio health; routes to services | none |
| auth | Identity/JWT | `supabase/gotrue:v2.196.0` | `core/services/auth/Dockerfile` | Source is local; image not yet local | db | database state |
| rest | Data API | `postgrest/postgrest:v14.17` | no local Dockerfile | Upstream image | db | none |
| realtime | WebSocket/change feed | `supabase/realtime:v2.134.10` | `core/services/realtime/Dockerfile` | Source is local; image not yet local | db | realtime schema |
| storage | Object/file API | `supabase/storage-api:v1.74.0` | `core/services/storage/Dockerfile` | Source is local; image not yet local | db, rest, imgproxy | storage volume |
| imgproxy | Image transformation | `darthsim/imgproxy:v3.31.4` | third-party | External dependency | storage volume | storage volume |
| meta | DB metadata API | `supabase/postgres-meta:v0.99.0` | `core/services/postgres-meta/Dockerfile` | Source is local; image not yet local | db | none |
| functions | Edge functions | `supabase/edge-runtime:v1.76.2` | `core/services/edge-runtime/Dockerfile` | Source is local; image not yet local | gateway; db credentials | functions volume, Deno cache |
| db | PostgreSQL | `supabase/postgres:17.6.1.136` | no local Dockerfile | Upstream-derived image | init SQL | PostgreSQL data + db-config |
| supavisor | Pooler | `supabase/supavisor:2.9.12` | `core/services/supavisor/Dockerfile` | Source is local; image not yet local | db | pooler config |

### Optional observability stack

| Service | Current image | Ownership |
|---|---|---|
| analytics | `supabase/logflare:1.50.10` | Upstream image |
| vector | `timberio/vector:0.53.0-alpine` | External image |

### Optional object storage / proxy

| Service | Current image | Ownership |
|---|---|---|
| minio | `cgr.dev/chainguard/minio` | External image |
| minio-createbucket | `cgr.dev/chainguard/minio-client:latest-dev` | External image |
| caddy | `caddy:2` | External image, floating tag |
| nginx | `jonasal/nginx-certbot:6.2.0-nginx1.31.5` | External image |

## Dependency graph

```
                         Internet
                            |
                         Caddy/Nginx
                            |
                         api-gw/Envoy
                 ___________|________________
                |       |       |      |      |
              Studio   Auth   REST  Realtime Storage
                |       |       |      |      |
                +-------+-------+------+------+ 
                                |
                           PostgreSQL
                                |
                           Supavisor
                                |
                         client DB pools

Storage ---> REST ---> PostgreSQL
Storage ---> imgproxy ---> storage volume
Functions ---> api-gw
Functions ---> PostgreSQL
Studio ---> meta ---> PostgreSQL
Realtime ---> PostgreSQL
Auth ---> PostgreSQL
```

## Critical ownership gap

The source trees are now present in Testagram, but the default Compose stack still executes several upstream images. Therefore:

**source ownership != runtime image ownership**

We will not replace an image reference until its local Docker/build contract has been verified.

## Build map

### Phase A — already buildable from local source
- Auth
- Realtime
- Storage
- Edge Runtime
- Supavisor
- postgres-meta

### Phase B — requires a deliberate local build contract
- PostgreSQL
- PostgREST
- Studio
- Envoy gateway image (probably unnecessary to fork; configuration can remain Testagram-owned while the base stays upstream)
- imgproxy / observability / proxy images

### Phase C — ownership decision
- Logflare
- Vector
- MinIO
- Caddy
- Nginx

These are infrastructure dependencies rather than Testagram application source and should not automatically be forked.

## Environment-variable classes

### Database authority
`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_PASSWORD`, database-specific admin credentials.

### Authentication authority
`JWT_SECRET`, `JWT_JWKS`, `GOTRUE_JWT_*`, `SECRET_KEY_BASE`.

### API/gateway
`ANON_KEY`, `SERVICE_ROLE_KEY`, publishable/secret keys, `SUPABASE_PUBLIC_URL`, dashboard credentials.

### Storage
Storage backend, bucket, filesystem path, S3/MinIO credentials, imgproxy endpoint.

### Functions
Gateway URL, public URL, DB URL, JWT verification, function source volume.

### Operational
health checks, pool sizes, ports, region, restart policy, persistent volumes.

## Immediate build-order

1. Pin the source revisions.
2. Build Auth from `core/services/auth`.
3. Build Realtime.
4. Build Storage.
5. Build Edge Runtime.
6. Build Supavisor.
7. Build postgres-meta.
8. Establish reproducible PostgREST build.
9. Establish Testagram PostgreSQL image strategy.
10. Establish Studio image strategy.
11. Replace Compose image references progressively.
12. Run a complete integration stack.
13. Only then remove remaining upstream runtime images where ownership adds value.

## Important non-goals

We should **not** fork every image simply because it is present.

A Testagram-owned backend can legitimately use well-pinned infrastructure images such as Envoy, Caddy, imgproxy, Vector and MinIO while owning the application/control-plane images.

The objective is control, reproducibility and verifiable provenance — not unnecessary duplication.
