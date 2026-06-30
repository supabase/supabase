import { proxy, useSnapshot } from 'valtio'

import { getWarehouseQualifiedTableName } from './warehouseNaming.utils'

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

const DEFAULT_WAREHOUSE_COPY_FIELDS = {
  syncState: 'live' as const,
  lagSeconds: 12,
  warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
}

export function resolveWarehouseTableState(
  tableKey: string,
  storedState: WarehouseTableState,
  { isWarehouseView }: { isWarehouseView: boolean }
): WarehouseTableState {
  const hasWarehouseCopy = storedState.mode === 'has_warehouse_copy' || isWarehouseView
  if (!hasWarehouseCopy) return storedState

  return {
    mode: 'has_warehouse_copy',
    syncState: storedState.syncState ?? DEFAULT_WAREHOUSE_COPY_FIELDS.syncState,
    lagSeconds: storedState.lagSeconds ?? DEFAULT_WAREHOUSE_COPY_FIELDS.lagSeconds,
    warehouseSizeBytes:
      storedState.warehouseSizeBytes ?? DEFAULT_WAREHOUSE_COPY_FIELDS.warehouseSizeBytes,
    lastSyncedAt: storedState.lastSyncedAt,
    copyName: storedState.copyName ?? getWarehouseQualifiedTableName(tableKey),
  }
}

export function setTableMode(key: string, mode: 'has_warehouse_copy'): void {
  const now = new Date().toISOString()

  warehouseDemoStore.tables[key] = {
    mode,
    warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
    syncState: 'live',
    lagSeconds: 12,
    lastSyncedAt: now,
    copyName: getWarehouseQualifiedTableName(key),
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
