# Multi-Database Supabase

This document describes the multi-database Supabase architecture and how to operate it.

## Architecture Overview

Each database project gets its own isolated set of services:

- **PostgreSQL** (`db-<ref>`) — isolated database
- **GoTrue** (`supabase-auth-<ref>`) — isolated auth service
- **PostgREST** (`supabase-rest-<ref>`) — isolated REST API

A single **Envoy** gateway sits in front and routes requests to the correct backend
using the `X-Project-Ref` HTTP header.

```
Client Request
  + X-Project-Ref: project-alpha
         |
         v
    [Envoy :8000]
         |
         +-- X-Project-Ref: project-alpha --> supabase-auth-project-alpha :9999
         |                                --> supabase-rest-project-alpha :3000
         |
         +-- X-Project-Ref: project-beta  --> supabase-auth-project-beta  :9999
         |                                --> supabase-rest-project-beta  :3000
         |
         +-- (no header / default)        --> supabase-auth :9999
                                          --> supabase-rest :3000
```

## Database Registry

All databases are registered in `docker/volumes/registry/databases.json`.

To add a new database project:
1. Add an entry to `databases.json`.
2. Add the corresponding services to `docker/docker-compose.yml`.
3. Run `./scripts/apply-envoy-config.sh --restart-lds` to regenerate and apply routing.

## Client Configuration

To route requests to a specific database, include the `X-Project-Ref` header in every request.

### JavaScript / TypeScript (Supabase JS client)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: {
      'X-Project-Ref': 'project-alpha'
    }
  }
})
```

### Direct HTTP with curl

```bash
# Auth health check for project-alpha
curl -H "X-Project-Ref: project-alpha" \
     http://localhost:8000/auth/v1/health

# REST query for project-beta
curl -H "X-Project-Ref: project-beta" \
     -H "Authorization: Bearer <ANON_KEY>" \
     http://localhost:8000/rest/v1/my_table

# Default database (no header required)
curl -H "Authorization: Bearer <ANON_KEY>" \
     http://localhost:8000/rest/v1/my_table
```

### Python (httpx / requests)

```python
import httpx

headers = {
    "X-Project-Ref": "project-alpha",
    "Authorization": f"Bearer {ANON_KEY}",
}
resp = httpx.get("http://localhost:8000/rest/v1/my_table", headers=headers)
```

## Envoy Configuration

Envoy config files are in `docker/volumes/api/envoy/`:

| File | Purpose |
|---|---|
| `envoy.yaml` | Bootstrap: points Envoy at cds.yaml and lds.yaml for dynamic config |
| `cds.yaml` | Cluster definitions (one per service backend) |
| `lds.template.yaml` | Listener + route table with header-based routing |
| `lds.multi.patch.yaml` | Documentation of per-project route entries and how to apply them |

### File-based xDS (inotify)

Envoy is configured with `path_config_source` for both CDS and LDS. It watches the
`/etc/envoy` directory with inotify and reloads configs automatically when files change.

- **CDS** (clusters): reloaded automatically — no restart needed.
- **LDS** (listeners/routes): reloaded automatically from file changes, but if the
  schema changes significantly, a restart may be required:
  ```bash
  docker compose -f docker/docker-compose.yml restart envoy
  ```

### Regenerating Config

After adding a database to the registry:

```bash
# Update clusters only (auto-reloaded):
python3 scripts/generate-envoy-config.py --cds > docker/volumes/api/envoy/cds.yaml

# Get route snippet to merge into lds.template.yaml:
python3 scripts/generate-envoy-config.py --lds

# Or run the all-in-one apply script:
./scripts/apply-envoy-config.sh             # CDS only (no restart)
./scripts/apply-envoy-config.sh --restart-lds  # CDS + LDS + Envoy restart
```

### Header-Based Routing in Envoy Config Syntax

The current Envoy config uses `string_match.exact` for header matching, which is
supported in Envoy v1.18+ (API v3). The installed version is `envoyproxy/envoy:v1.30`.

```yaml
- match:
    prefix: /auth/v1/
    headers:
      - name: X-Project-Ref
        string_match:
          exact: project-alpha
  route:
    cluster: auth-project-alpha
    prefix_rewrite: /
```

## Existing Clusters (cds.yaml)

Default clusters present in the base config:

| Cluster Name | Service | Address | Port |
|---|---|---|---|
| `auth` | GoTrue (default) | supabase-auth | 9999 |
| `rest` | PostgREST (default) | supabase-rest | 3000 |
| `realtime` | Realtime | realtime-dev.supabase-realtime | 4000 |
| `storage` | Storage | supabase-storage | 5000 |
| `meta` | pg-meta | supabase-meta | 8080 |
| `functions` | Edge Functions | supabase-edge-functions | 9000 |
| `auth-project-alpha` | GoTrue (alpha) | supabase-auth-project-alpha | 9999 |
| `rest-project-alpha` | PostgREST (alpha) | supabase-rest-project-alpha | 3000 |
| `auth-project-beta` | GoTrue (beta) | supabase-auth-project-beta | 9999 |
| `rest-project-beta` | PostgREST (beta) | supabase-rest-project-beta | 3000 |

## Secrets / Environment Variables

Each database project should have its own JWT secret and database password.
Configure them in a `.env` file (never commit to git):

```
# Default
POSTGRES_PASSWORD=postgres
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# project-alpha
POSTGRES_PASSWORD_ALPHA=postgres
JWT_SECRET_ALPHA=another-secret-for-alpha-at-least-32-characters

# project-beta
POSTGRES_PASSWORD_BETA=postgres
JWT_SECRET_BETA=another-secret-for-beta-at-least-32-characters
```