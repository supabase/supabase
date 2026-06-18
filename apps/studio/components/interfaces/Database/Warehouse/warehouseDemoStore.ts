import { proxy, useSnapshot } from 'valtio'

export type WarehouseMode = 'postgres' | 'has_warehouse_copy' | 'warehouse_backed'
export type SyncState = 'syncing' | 'live' | 'error'

export interface WarehouseTableState {
  mode: WarehouseMode
  syncState?: SyncState
  lagSeconds?: number
  lastSyncedAt?: string
  migrationCompletedAt?: string
  copyName?: string
  warehouseSizeBytes?: number
}

export const warehouseDemoStore = proxy<{
  tables: Record<string, WarehouseTableState>
  catalogEnabled: boolean
  dataApiEnabled: boolean
}>({
  tables: {},
  catalogEnabled: false,
  dataApiEnabled: false,
})

const DEMO_WAREHOUSE_SIZE_BYTES = 197_912_092_672 // ~184 GB

function tableNameFromKey(key: string): string {
  return key.split('.').pop() ?? key
}

export function setTableMode(key: string, mode: 'has_warehouse_copy' | 'warehouse_backed'): void {
  const now = new Date().toISOString()
  const tableName = tableNameFromKey(key)

  warehouseDemoStore.tables[key] = {
    mode,
    warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
    ...(mode === 'has_warehouse_copy' && {
      syncState: 'live' as SyncState,
      lagSeconds: 12,
      lastSyncedAt: now,
      copyName: `warehouse.${tableName}`,
    }),
    ...(mode === 'warehouse_backed' && {
      migrationCompletedAt: now,
    }),
  }
}

export function clearTableMode(key: string): void {
  delete warehouseDemoStore.tables[key]
}

export function setCatalogEnabled(enabled: boolean): void {
  warehouseDemoStore.catalogEnabled = enabled
}

export function setDataApiEnabled(enabled: boolean): void {
  warehouseDemoStore.dataApiEnabled = enabled
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
