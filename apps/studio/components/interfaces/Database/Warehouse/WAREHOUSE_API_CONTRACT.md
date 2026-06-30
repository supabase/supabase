# Warehouse table metadata API contract

Prototype Studio code uses `?view=warehouse` on table detail URLs and `warehouseDemoStore` until the table metadata API exposes warehouse state. This document describes the target API shape.

## Goals

- Replace `?view=warehouse` query-param context with server truth
- Replace `warehouseDemoStore` enable/detach/sync fields with API responses
- Support **copy mode** (postgres + warehouse) and **warehouse-only** (post-Move, no postgres table)

## Project-level replication status

One Warehouse replication pipeline serves all linked tables. Lag and phase are **project-scoped**, not per-table.

```ts
type ReplicationPhase = 'initial_sync' | 'streaming' | 'error'
type PipelineStatus = 'live' | 'error'

interface WarehouseProjectReplicationStatus {
  /** Seconds behind the Postgres WAL for this project’s Warehouse pipeline */
  replication_lag_seconds: number
  /** Overall pipeline phase */
  replication_phase: ReplicationPhase
  /** Pipeline health summary */
  pipeline_status: PipelineStatus
}
```

Consumed by **Observability → Warehouse** (mock sparklines in prototype; real monitor API later).

## Proposed fields on table metadata

Returned by table editor / catalog queries (`getTableEditor`, table list, etc.):

```ts
type TableStorageMode = 'postgres' | 'postgres_with_warehouse_copy' | 'warehouse_only'
type CopyStatus = 'backfilling' | 'live' | 'error'

interface WarehouseTableMetadata {
  /** How this table is stored and surfaced in Studio */
  storage_mode: TableStorageMode

  /**
   * OID of the related table on the other side, when applicable.
   * - copy mode, viewing postgres: warehouse table OID
   * - copy mode, viewing warehouse: postgres table OID
   * - warehouse_only: omitted
   */
  linked_table_id?: number

  /** Warehouse schema name when a copy exists or this is a warehouse table (e.g. public_warehouse) */
  warehouse_schema?: string

  /** Qualified warehouse relation name (e.g. public_warehouse.events) */
  warehouse_qualified_name?: string

  /** Table-scoped copy progress (not project lag) */
  warehouse_copy_status?: CopyStatus
  warehouse_size_bytes?: number
  warehouse_last_synced_at?: string
}
```

**Do not** put `warehouse_lag_seconds` on per-table metadata. Lag belongs on `WarehouseProjectReplicationStatus`.

## Studio routing rules (target)

| `storage_mode`                 | List schema          | Row click URL                          | Detail page                                         |
| ------------------------------ | -------------------- | -------------------------------------- | --------------------------------------------------- |
| `postgres`                     | `public`             | `/database/tables/{id}`                | Full postgres tabs                                  |
| `postgres_with_warehouse_copy` | `public`             | `/database/tables/{id}`                | Full postgres tabs; Settings > Storage manages copy |
| `postgres_with_warehouse_copy` | `{source}_warehouse` | `/database/tables/{id}?view=warehouse` | Single warehouse detail page                        |
| `warehouse_only`               | `{source}_warehouse` | `/database/tables/{id}?view=warehouse` | Single warehouse detail page (canonical home)       |

After API lands, `view=warehouse` becomes optional when the requested table OID is already the warehouse relation (`table.schema` ends with `_warehouse`).

## Lifecycle: Move

1. **Before Move**: `storage_mode = postgres_with_warehouse_copy`, postgres OID is primary, warehouse detail is a read-only lens.
2. **After Move**: `storage_mode = warehouse_only`, postgres table removed, warehouse OID is primary. Postgres detail URL should 404 or redirect to warehouse detail.

Detach (copy removed, postgres remains): `storage_mode` returns to `postgres`; warehouse schema row disappears from list.

## Demo store mapping (interim)

| Demo store                                       | API equivalent                                 |
| ------------------------------------------------ | ---------------------------------------------- |
| `mode: 'postgres'`                               | `storage_mode: 'postgres'`                     |
| `mode: 'has_warehouse_copy'`                     | `storage_mode: 'postgres_with_warehouse_copy'` |
| `copyStatus: 'backfilling' \| 'live' \| 'error'` | `warehouse_copy_status`                        |
| `projectReplication.replicationLagSeconds`       | `replication_lag_seconds` (project)            |
| `projectReplication.replicationPhase`            | `replication_phase` (project)                  |
| (not implemented)                                | `storage_mode: 'warehouse_only'`               |

Remove `warehouseDemoStore` when list/detail queries return `WarehouseTableMetadata` and a project replication endpoint exists.

## Observability

**Observability → Warehouse** reads `WarehouseProjectReplicationStatus` plus a linked-table count derived from tables with `storage_mode = postgres_with_warehouse_copy`. Prototype uses mock sparklines until the monitor API is available.
