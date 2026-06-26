import { proxy, useSnapshot } from 'valtio'

export type WarehouseMode = 'postgres' | 'has_warehouse_copy'
export type SyncState = 'syncing' | 'live' | 'error'

export interface WarehouseTableState {
  mode: WarehouseMode
  syncState?: SyncState
  lagSeconds?: number
  lastSyncedAt?: string
  copyName?: string
  warehouseSizeBytes?: number
}

export const warehouseDemoStore = proxy<{
  tables: Record<string, WarehouseTableState>
  catalogEnabled: boolean
}>({
  tables: {},
  catalogEnabled: false,
})

const DEMO_WAREHOUSE_SIZE_BYTES = 197_912_092_672 // ~184 GB

function tableNameFromKey(key: string): string {
  return key.split('.').pop() ?? key
}

export function setTableMode(key: string, mode: 'has_warehouse_copy'): void {
  const now = new Date().toISOString()
  const tableName = tableNameFromKey(key)

  warehouseDemoStore.tables[key] = {
    mode,
    warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
    syncState: 'live',
    lagSeconds: 12,
    lastSyncedAt: now,
    copyName: `warehouse.${tableName}`,
  }
}

export function clearTableMode(key: string): void {
  delete warehouseDemoStore.tables[key]
}

export function setCatalogEnabled(enabled: boolean): void {
  warehouseDemoStore.catalogEnabled = enabled
}

export function useWarehouseTableState(tableKey: string): WarehouseTableState {
  const snap = useSnapshot(warehouseDemoStore)
  return (snap.tables[tableKey] as WarehouseTableState | undefined) ?? { mode: 'postgres' }
}

export function formatWarehouseSize(bytes: number | undefined): string {
  if (bytes === undefined) return '184 GB'
  const gb = bytes / 1024 ** 3
  return `${Math.round(gb)} GB`
}

export function getWarehouseStorageSummaryLabel(
  state: Pick<WarehouseTableState, 'mode' | 'warehouseSizeBytes'> | undefined,
  postgresSize?: string
): string | null {
  const mode = state?.mode ?? 'postgres'
  const warehouseSize = formatWarehouseSize(state?.warehouseSizeBytes)

  if (mode === 'postgres') return null
  return postgresSize ? `${postgresSize} · Copy · ${warehouseSize}` : `Copy · ${warehouseSize}`
}
