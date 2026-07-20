# Warehouse — required new platform endpoints

This document specifies the **new platform API endpoints** the Studio Warehouse feature calls. None
of them exist yet — the Studio hooks in this folder (`data/warehouse/*`) call them and will 404
until the backend ships. The goal here is to design the payloads and enumerate the work for the
platform team. **No platform code has been written.**

The endpoints live in the existing platform API repo (NestJS) alongside replication, e.g.
`/Users/bnj/supabase/platform/api/apps/mgmt-api/src/routes/platform/`.

## Architecture: Warehouse is a thin layer over Replication + DuckLake

The Warehouse product reuses the existing replication/ETL machinery. Conceptually:

- Each project has **at most one** "warehouse pipeline": a DuckLake destination plugged into the
  project itself, plus a pipeline and a publication. Naming convention:
  - pipeline/destination name: `supabase_warehouse_pipeline`
  - publication name: `_supabase_warehouse_pub`
  - warehouse table naming: each source table is exposed as `{source_schema}_warehouse.{table}`
    (e.g. `public.orders` → `public_warehouse.orders`) to avoid clashes across schemas — this is the
    `copy_name` returned below and the name users query in the SQL Editor.
  - ✅ **Already implemented — do not re-build:** the "max one DuckLake destination per project"
    rule is enforced by the platform in
    [supabase/platform#34718](https://github.com/supabase/platform/pull/34718). The warehouse
    endpoints can rely on it; the "ensure the pipeline exists" step just creates the destination on
    first use and is a safe no-op afterwards — no singleton check needs to be added here.
- **"Copy to Warehouse"** for a table = ensure that pipeline exists (create it lazily on first use),
  add the table to its publication, and ensure the pipeline is running.
- **"Detach Warehouse copy"** = remove the table from the publication (and drop its DuckLake copy).
- **Catalog access** = a project-level toggle that exposes catalog credentials so external query
  engines can read the DuckLake tables without touching Postgres.

The warehouse endpoints are a **convenience facade** so Studio never has to orchestrate
sources/destinations/pipelines/publications directly. Internally they call the existing replication
service (see `replication.client.ts`) and the DuckLake config resolver
(`ducklake-supabase-config.ts`).

### Existing building blocks reused (already in the platform API)

| Concern                       | Existing endpoint / module                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Create tenant + source        | `POST /platform/replication/{ref}/tenants-sources`                                    |
| Create destination + pipeline | `POST /platform/replication/{ref}/destinations-pipelines`                             |
| Start / stop pipeline         | `POST /platform/replication/{ref}/pipelines/{id}/start` \| `/stop`                    |
| Pipeline status               | `GET /platform/replication/{ref}/pipelines/{id}/status`                               |
| Per-table replication status  | `GET /platform/replication/{ref}/pipelines/{id}/replication-status`                   |
| Create / update publication   | `POST /platform/replication/{ref}/sources/{source_id}/publications[/{name}]`          |
| DuckLake destination config   | `ReplicationDucklakeConfigSchema` in `destinations.dto.ts` (Supabase-managed variant) |

The DuckLake destination for the warehouse pipeline uses the **Supabase-managed** variant, pointed
at the project itself:

```jsonc
{
  "ducklake": {
    "catalog": { "type": "supabase_project", "project_ref": "<ref>" },
    "storage": { "type": "supabase_storage", "project_ref": "<ref>", "bucket": "warehouse" },
  },
}
```

---

## New endpoints

Base path: `/platform/warehouse/{ref}` (mirrors `/platform/replication/{ref}`).
Auth: `@AuthWithProjectRef(PermissionAction.REPLICATION_ADMIN_READ | WRITE, '*')` (or a dedicated
`WAREHOUSE_ADMIN_*` action). Gate writes behind the same entitlement as ETL
(`@ApiEntitlementRequired('replication.etl')` or a new `warehouse` entitlement).

### 1. List linked tables — `GET /platform/warehouse/{ref}/tables`

Returns every table that currently has a Warehouse copy, with live sync status. Drives the Tables
list chips, the table-detail header badge, and the Storage panel.

Response `200`:

```jsonc
{
  "tables": [
    {
      "schema": "public",
      "name": "orders",
      "state": "live", // 'syncing' | 'live' | 'error'  (derived from replication-status)
      "lag_ms": 12000, // optional
      "last_synced_at": "2026-06-23T17:48:00Z", // optional ISO-8601
      "copy_name": "public_warehouse.orders", // {source_schema}_warehouse.{table}
      "warehouse_size_bytes": 197912092672, // optional
    },
  ],
}
```

Server behavior: if no warehouse pipeline exists, return `{ "tables": [] }`. Otherwise read the
publication's table list and join with `GET .../pipelines/{id}/replication-status` to populate
`state` / `lag_ms` / `last_synced_at`. Tables not in the publication are simply absent (Studio
treats absent = Postgres-only).

Studio hook: `useWarehouseTablesQuery` (`warehouse-tables-query.ts`).

### 2. Link a table ("Copy to Warehouse") — `POST /platform/warehouse/{ref}/tables`

Request:

```jsonc
{ "schema": "public", "name": "orders" }
```

Response `202`: the new linked-table row (same shape as an item in endpoint #1). `state` will
usually be `"syncing"` initially.

Server behavior (idempotent):

1. Ensure the warehouse tenant + source exist (`tenants-sources`).
2. Ensure the `supabase_warehouse_pipeline` destination + pipeline exist. If not, create the
   DuckLake destination (Supabase-managed, pointed at this project) + pipeline +
   `_supabase_warehouse_pub` via `destinations-pipelines`. The one-DuckLake-destination-per-
   project limit is already enforced (supabase/platform#34718), so this step never has to guard
   against duplicates — it just creates on first use.
3. Add `{schema, name}` to `_supabase_warehouse_pub` (create-or-update publication).
4. Ensure the pipeline is running (`/start` if stopped).

Errors: `409` if the table can't be replicated (e.g. no primary key / replica identity), `402` if
the entitlement is missing.

Studio hook: `useWarehouseLinkTableMutation` (`link-table-mutation.ts`).

### 3. Detach a table ("Detach Warehouse copy") — `DELETE /platform/warehouse/{ref}/tables/{schema}/{name}`

Response `204`.

Server behavior: remove `{schema, name}` from `_supabase_warehouse_pub` (update publication)
so the table stops syncing. **For now the existing DuckLake data is left in place** — detach only
removes the table from the catalog/publication; it does **not** delete the columnar copy (data
cleanup is deferred). Leave the pipeline running for the remaining tables; if it was the last table,
the pipeline may be stopped (implementation detail). The Postgres source table is untouched.

Studio hook: `useWarehouseDetachTableMutation` (`detach-table-mutation.ts`).

### 4. Get catalog access — `GET /platform/warehouse/{ref}/catalog`

Returns whether external catalog access is enabled and, if so, the credentials external query
engines use.

Response `200`:

```jsonc
{
  "enabled": true,
  // present only when enabled; resolved from the project's DuckLake config (current project)
  "credentials": {
    // DuckLake catalog = the project's own Postgres (sslmode=require)
    "catalog_url": "postgres://warehouse_ro:<pwd>@db.<ref>.supabase.co:5432/postgres",
    // DuckLake data files in the project's storage bucket
    "data_path": "s3://warehouse/<ref>",
    "s3_endpoint": "<ref>.storage.supabase.co/storage/v1/s3",
    "s3_region": "us-east-1",
    "s3_access_key_id": "...",
    "s3_secret_access_key": "...", // secret; only returned to project admins
    "metadata_schema": "ducklake",
  },
}
```

Studio hook: `useWarehouseCatalogQuery` (`warehouse-catalog-query.ts`).

### 5. Enable / disable catalog access — `POST /platform/warehouse/{ref}/catalog`

Request:

```jsonc
{ "enabled": true }
```

Response `200`: same shape as endpoint #4 (on enable, includes freshly provisioned `credentials`).

Server behavior: on enable, provision read credentials for the project's DuckLake catalog — a scoped
Postgres connection for the catalog metadata plus S3 credentials for the storage bucket (reusing the
same `supabase_project` / `supabase_storage` resolution as the replication DuckLake destination); on
disable, revoke them. Access is managed independently from the project's database connection settings.

Studio hook: `useUpdateWarehouseCatalogMutation` (`warehouse-catalog-mutation.ts`).

### (Optional, not yet called by Studio)

- `POST /platform/warehouse/{ref}/catalog/token/rotate` → rotate the access token.
- `GET /platform/warehouse/{ref}` → project-level overview (`{ provisioned, pipeline_id,
pipeline_status, catalog: { enabled } }`) if a single status call is preferred over #1 + #4.

---

## Catalog credentials = DuckLake on the current project

The Warehouse reuses the replication product's **DuckLake** destination in its Supabase-managed form —
except the **current project is used for BOTH the catalog and the storage** (the user does not pick
projects). That is the config the replication product already builds:

```jsonc
{
  "ducklake": {
    "catalog": { "type": "supabase_project", "project_ref": "<ref>" },
    "storage": { "type": "supabase_storage", "project_ref": "<ref>", "bucket": "warehouse" },
  },
}
```

The platform resolves this into the concrete connection details returned by endpoint #4 — a Postgres
catalog URL (the project DB), an S3 data path + S3 credentials (the project storage bucket), and the
DuckLake metadata schema — i.e. exactly the fields the existing `ducklake-supabase-config.ts` resolver
already produces for a replication destination. Studio renders these as a DuckDB
`ATTACH 'ducklake:...'` snippet (plus a raw env-var view) in `warehouseCatalog.constants.ts`.

Implementation note: the platform work is the same source/destination/pipeline plumbing as
replication, with the catalog + storage `project_ref` pinned to `{ref}` and surfaced read-only.

---

## Hook → endpoint → underlying replication mapping

| Studio hook                         | New warehouse endpoint                              | Underlying replication work                                                                |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `useWarehouseTablesQuery`           | `GET .../warehouse/{ref}/tables`                    | read publication tables + `replication-status`                                             |
| `useWarehouseLinkTableMutation`     | `POST .../warehouse/{ref}/tables`                   | ensure pipeline (`tenants-sources`, `destinations-pipelines`) + update publication + start |
| `useWarehouseDetachTableMutation`   | `DELETE .../warehouse/{ref}/tables/{schema}/{name}` | update publication (remove table)                                                          |
| `useWarehouseCatalogQuery`          | `GET .../warehouse/{ref}/catalog`                   | read catalog access + credentials                                                          |
| `useUpdateWarehouseCatalogMutation` | `POST .../warehouse/{ref}/catalog`                  | provision/revoke catalog credentials                                                       |

## Excluded (deferred upstream)

- **Move to Warehouse** (fully migrating a table off the Postgres heap) — already deferred to a
  separate branch; no endpoint designed here.
- **Snapshots / time-travel** — only surfaced after a Move in the prototype; out of scope.
