/**
 * Studio-facing model for the Warehouse product.
 *
 * Under the hood a "Warehouse copy" is a table linked into the project's DuckLake replication
 * pipeline (`supabase_warehouse_pipeline`) and added to its publication. These types describe what
 * the table surfaces need, decoupled from the lower-level replication/destination payloads.
 */

export type WarehouseMode = 'postgres' | 'has_warehouse_copy'
export type WarehouseSyncState = 'syncing' | 'live' | 'error'

/** Row returned by `GET /platform/warehouse/{ref}/tables` (snake_case, mirrors the API). */
export interface WarehouseLinkedTable {
  schema: string
  name: string
  state: WarehouseSyncState
  lag_ms?: number
  last_synced_at?: string
  copy_name: string
  warehouse_size_bytes?: number
}

/** UI-facing per-table storage state consumed by the table surfaces. */
export interface WarehouseTableState {
  mode: WarehouseMode
  syncState?: WarehouseSyncState
  lagSeconds?: number
  lastSyncedAt?: string
  copyName?: string
  warehouseSizeBytes?: number
}

/** Default state for a table that has not been linked to Warehouse. */
export const POSTGRES_TABLE_STATE: WarehouseTableState = { mode: 'postgres' }

export const tableKeyOf = (schema: string, name: string) => `${schema}.${name}`

/** Maps an API linked-table row onto the UI-facing state. A listed table always has a copy. */
export function tableStateFromLinkedTable(table: WarehouseLinkedTable): WarehouseTableState {
  return {
    mode: 'has_warehouse_copy',
    syncState: table.state,
    lagSeconds: table.lag_ms !== undefined ? Math.round(table.lag_ms / 1000) : undefined,
    lastSyncedAt: table.last_synced_at,
    copyName: table.copy_name,
    warehouseSizeBytes: table.warehouse_size_bytes,
  }
}

export function formatWarehouseSize(bytes: number | undefined): string {
  if (bytes === undefined) return '—'
  const gb = bytes / 1024 ** 3
  return `${Math.round(gb)} GB`
}

/**
 * Inline storage summary shown next to a table (e.g. "112 kB · Copy · 184 GB"). Returns null when
 * the table lives only in the Postgres heap so callers can fall back to the plain Postgres size.
 */
export function getWarehouseStorageSummaryLabel(
  state: Pick<WarehouseTableState, 'mode' | 'warehouseSizeBytes'> | undefined,
  postgresSize?: string
): string | null {
  const mode = state?.mode ?? 'postgres'
  if (mode === 'postgres') return null

  const hasSize = state?.warehouseSizeBytes !== undefined
  const warehouseSize = formatWarehouseSize(state?.warehouseSizeBytes)

  if (postgresSize && hasSize) return `${postgresSize} · Copy · ${warehouseSize}`
  if (postgresSize) return `${postgresSize} · Copy`
  if (hasSize) return `Copy · ${warehouseSize}`
  return 'Copy'
}

/**
 * Async Warehouse setup, surfaced by `GET /platform/warehouse/{ref}/setup-status`.
 *
 * The setup runs in the worker after "Copy to Warehouse": provision the replication pipeline,
 * copy the initial data into DuckLake, then install the Warehouse FDW so the copy is queryable.
 * These types mirror the API (snake_case) so the table settings surface can show setup progress.
 */
export type WarehouseSetupStatus =
  | 'not_started'
  | 'setting_up'
  | 'copying'
  | 'installing_fdw'
  | 'complete'
  | 'error'

export type WarehouseSetupStepName = 'warehouse_pipeline' | 'warehouse_copy' | 'warehouse_fdw'
export type WarehouseSetupStepStatus = 'waiting' | 'running' | 'completed' | 'error'

export interface WarehouseSetupStep {
  name: WarehouseSetupStepName
  status: WarehouseSetupStepStatus
  message?: string
}

export interface WarehouseFdwSetupStatus {
  extension_installed: boolean
  wrapper_installed: boolean
  server_configured: boolean
  schema_created: boolean
  foreign_schema_imported: boolean
}

/** Response of `GET /platform/warehouse/{ref}/setup-status`. */
export interface WarehouseSetupStatusResponse {
  setup_status: WarehouseSetupStatus
  pipeline_id?: number
  steps: WarehouseSetupStep[]
  tables: WarehouseLinkedTable[]
  fdw_status: WarehouseFdwSetupStatus
}

/** Setup phases where the async worker chain is still running. */
export const WAREHOUSE_SETUP_IN_PROGRESS_STATUSES: readonly WarehouseSetupStatus[] = [
  'setting_up',
  'copying',
  'installing_fdw',
]

export function isWarehouseSetupInProgress(status?: WarehouseSetupStatus): boolean {
  return status !== undefined && WAREHOUSE_SETUP_IN_PROGRESS_STATUSES.includes(status)
}

/** Short human label for each Warehouse setup status. */
export const WAREHOUSE_SETUP_STATUS_LABELS: Record<WarehouseSetupStatus, string> = {
  not_started: 'Not started',
  setting_up: 'Setting up',
  copying: 'Copying data',
  installing_fdw: 'Finalizing access',
  complete: 'Ready',
  error: 'Setup failed',
}
