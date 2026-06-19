import { proxy, useSnapshot } from 'valtio'

export type WarehouseMode = 'postgres' | 'has_warehouse_copy' | 'warehouse_backed'
export type SyncState = 'syncing' | 'live' | 'error'

export interface WarehouseSnapshot {
  id: string
  createdAt: string
  sizeBytes: number
}

export interface WarehouseTableState {
  mode: WarehouseMode
  syncState?: SyncState
  lagSeconds?: number
  lastSyncedAt?: string
  migrationCompletedAt?: string
  copyName?: string
  warehouseSizeBytes?: number
  snapshots?: WarehouseSnapshot[]
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

const DEMO_SNAPSHOTS: WarehouseSnapshot[] = Array.from({ length: 20 }, (_, index) => {
  const dayOffset = index
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - dayOffset)
  date.setUTCHours(8, 0, 0, 0)

  return {
    id: `snap_${String(index + 1).padStart(3, '0')}`,
    createdAt: date.toISOString(),
    sizeBytes: 190_000_000_000 - index * 500_000_000,
  }
})

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
      snapshots: DEMO_SNAPSHOTS.map((snapshot) => ({ ...snapshot })),
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

export function getWarehouseSnapshots(tableKey: string): WarehouseSnapshot[] {
  const state = warehouseDemoStore.tables[tableKey]
  if (state?.mode !== 'warehouse_backed') return []
  return state.snapshots ?? DEMO_SNAPSHOTS
}
