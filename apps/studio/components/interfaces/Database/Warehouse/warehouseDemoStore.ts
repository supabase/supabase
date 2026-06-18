import { proxy, useSnapshot } from 'valtio'

export type WarehouseMode = 'postgres' | 'has_warehouse_copy' | 'warehouse_backed'
export type SyncState = 'syncing' | 'live' | 'error'

export interface WarehouseTableState {
  mode: WarehouseMode
  syncState?: SyncState
  lagSeconds?: number
  lastSyncedAt?: string
  migrationCompletedAt?: string
}

export const warehouseDemoStore = proxy<{
  tables: Record<string, WarehouseTableState>
}>({
  tables: {},
})

export function setTableMode(key: string, mode: 'has_warehouse_copy' | 'warehouse_backed'): void {
  const now = new Date().toISOString()
  warehouseDemoStore.tables[key] = {
    mode,
    ...(mode === 'has_warehouse_copy' && {
      syncState: 'live' as SyncState,
      lagSeconds: 12,
      lastSyncedAt: now,
    }),
    ...(mode === 'warehouse_backed' && {
      migrationCompletedAt: now,
    }),
  }
}

export function clearTableMode(key: string): void {
  delete warehouseDemoStore.tables[key]
}

export function useWarehouseTableState(tableKey: string): WarehouseTableState {
  const snap = useSnapshot(warehouseDemoStore)
  return (snap.tables[tableKey] as WarehouseTableState | undefined) ?? { mode: 'postgres' }
}
