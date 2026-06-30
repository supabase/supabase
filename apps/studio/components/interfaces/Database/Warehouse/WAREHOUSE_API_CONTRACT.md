# Warehouse table metadata API contract

Prototype Studio code uses `?view=warehouse` on table detail URLs and `warehouseDemoStore` until the table metadata API exposes warehouse state. This document describes the target API shape.

## Goals

- Replace `?view=warehouse` query-param context with server truth
- Replace `warehouseDemoStore` enable/detach/sync fields with API responses
- Support **copy mode** (postgres + warehouse) and **warehouse-only** (post-Move, no postgres table)

## Proposed fields on table metadata

Returned by table editor / catalog queries (`getTableEditor`, table list, etc.):

```ts
type TableStorageMode = 'postgres' | 'postgres_with_warehouse_copy' | 'warehouse_only'

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

  /** Warehouse-specific runtime fields */
  warehouse_sync_state?: 'syncing' | 'live' | 'error'
  warehouse_lag_seconds?: number
  warehouse_size_bytes?: number
  warehouse_last_synced_at?: string
}
```

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

| Demo store                   | API equivalent                                 |
| ---------------------------- | ---------------------------------------------- |
| `mode: 'postgres'`           | `storage_mode: 'postgres'`                     |
| `mode: 'has_warehouse_copy'` | `storage_mode: 'postgres_with_warehouse_copy'` |
| (not implemented)            | `storage_mode: 'warehouse_only'`               |

Remove `warehouseDemoStore` when list/detail queries return `WarehouseTableMetadata`.
