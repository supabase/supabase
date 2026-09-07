# Storage Multi-Tenancy Architecture

## Current State (Single-Database Mode)

In the default self-hosted configuration, Storage runs with:

```yaml
storage:
  image: supabase/storage-api:v1.22.25
  environment:
    TENANT_ID: stub
    DATABASE_URL: "postgresql://supabase_storage_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}"
```

`TENANT_ID: stub` means all files are stored under a single tenant namespace.
This works fine for one database but breaks tenant isolation when running multiple databases.

## Multi-Database Mode Options

### Option A: Shared Storage Instance with MULTI_TENANT=true (Recommended for <10 databases)

One Storage container serves all databases. Each request carries a `tenantId` parameter
(or header) that scopes the operation to the correct tenant's files and database rows.

**How it works:**
- Storage API v1.22+ supports `MULTI_TENANT=true` environment variable
- In this mode, the `TENANT_ID` env var is ignored; the tenant is determined per-request
- File paths are namespaced: `{STORAGE_FILE_BACKEND_PATH}/{tenant_id}/{bucket_id}/{object_path}`
- Postgres tables already have a `tenant_id` column — no schema changes needed

**Setup:**

```yaml
# docker/docker-compose.yml — modify the storage service:
storage:
  environment:
    MULTI_TENANT: "true"
    TENANT_ID: ""          # Empty in multi-tenant mode
    DATABASE_URL: "..."    # Points to any one DB; per-tenant DB URLs configured separately
```

> **Note:** As of Storage API v1.22.25 (the version pinned in this repo), `MULTI_TENANT` mode
> requires the Storage API to be configured with a multi-tenant database backend (a separate
> `tenants` table). This is the Supabase platform's internal architecture and is not fully
> documented for self-hosted use. **Option B is recommended for self-hosted deployments.**

**Pros:**
- Less infrastructure (one container, one file store)
- Shared storage quota across projects
- Simpler monitoring

**Cons:**
- Single point of failure for all projects' file storage
- MULTI_TENANT mode is not officially supported in self-hosted deployments
- Harder to give projects independent storage limits

### Option B: Per-Database Storage Instances (Recommended for Self-Hosted)

Each database gets its own Storage API container with `TENANT_ID` set to the project ref.
This is a simple extension of the existing single-database pattern.

**Setup:**

```bash
# Generate per-database compose services:
python3 scripts/generate-compose-storage.py > docker/docker-compose.storage.yml

# Initialize storage schema in each new database:
./scripts/init-storage-tenant.sh \
  --ref project-alpha \
  --host db-alpha \
  --password "$POSTGRES_PASSWORD_ALPHA"

# Start the stack with storage overrides:
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.auth.yml \
  -f docker/docker-compose.rest.yml \
  -f docker/docker-compose.storage.yml \
  up -d
```

**Pros:**
- True isolation — each project's storage is completely independent
- Uses the well-tested `TENANT_ID` single-tenant mode
- Each container can be scaled or restarted independently
- Straightforward configuration — same pattern as GoTrue (auth) and PostgREST (rest)

**Cons:**
- More containers (one per database)
- More configuration to manage

## Recommendation

**Use Option B (per-database instances) for self-hosted multi-database deployments.**

Option A (MULTI_TENANT) is Supabase's internal platform architecture and requires additional
infrastructure (a "tenant metadata" database) that is not part of the self-hosted stack.
Option B directly mirrors what other services (GoTrue, PostgREST) already do in this repo
and has zero dependencies on undocumented Storage API internals.

## File Path Namespacing (Option B)

In Option B, each Storage container has its own isolated directory:

```
volumes/storage/
├── default/          ← supabase-storage-default container
│   └── {bucket_id}/{object_path}
├── project-alpha/    ← supabase-storage-project-alpha container
│   └── {bucket_id}/{object_path}
└── project-beta/     ← supabase-storage-project-beta container
    └── {bucket_id}/{object_path}
```

The `generate-compose-storage.py` script mounts each directory at `/var/lib/storage`
inside its container:

```yaml
volumes:
  - ./volumes/storage/project-alpha:/var/lib/storage:z
```

Ensure directories exist before starting:

```bash
mkdir -p docker/volumes/storage/project-alpha
mkdir -p docker/volumes/storage/project-beta
```

## Storage API Version

The version currently pinned in `docker/docker-compose.yml`:

```
supabase/storage-api:v1.22.25
```

This version supports `TENANT_ID` (single-tenant) mode fully.
`MULTI_TENANT=true` support was introduced in later versions but requires additional
platform infrastructure not included in self-hosted Docker Compose.

## Database Schema

The `storage` schema must exist in each database. Run the initialization script:

```bash
./scripts/init-storage-tenant.sh \
  --ref <project-ref> \
  --host <db-host> \
  --password <password> \
  [--database postgres] \
  [--port 5432]
```

This creates:
- `storage.buckets` — bucket definitions
- `storage.objects` — object metadata with `path_tokens` computed column
- `storage.migrations` — migration tracking
- Row-Level Security policies for public buckets
- Grants to `supabase_storage_admin`, `anon`, `authenticated`, `service_role`

## Adding a New Database

```bash
# 1. Add database to registry
./scripts/add-database.sh \
  --ref project-gamma \
  --name "Gamma Project" \
  --host db-gamma \
  --password-env POSTGRES_PASSWORD_GAMMA \
  --jwt-secret-env JWT_SECRET

# 2. Initialize storage schema in new database
./scripts/init-storage-tenant.sh \
  --ref project-gamma \
  --host db-gamma \
  --password "$POSTGRES_PASSWORD_GAMMA"

# 3. Regenerate compose file
python3 scripts/generate-compose-storage.py > docker/docker-compose.storage.yml

# 4. Create storage volume directory
mkdir -p docker/volumes/storage/project-gamma

# 5. Restart storage stack
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.storage.yml \
  up -d supabase-storage-project-gamma
```

## Envoy Routing for Storage

Storage requests (`/storage/v1/`) should be routed to the correct per-database container.
Update `docker/volumes/api/envoy/cds.yaml` to add clusters for each storage service:

```yaml
- name: storage-project-alpha
  type: STRICT_DNS
  connect_timeout: 15s
  lb_policy: ROUND_ROBIN
  load_assignment:
    cluster_name: storage-project-alpha
    endpoints:
      - lb_endpoints:
          - endpoint:
              address:
                socket_address:
                  address: storage-project-alpha
                  port_value: 5000
```

And add route entries in `lds.template.yaml` to match `/project/{ref}/storage/v1/`
with prefix rewrite to `/storage/v1/`, forwarding to `storage-{ref}` cluster.
See `docker/MULTI_DATABASE.md` for the full routing strategy.