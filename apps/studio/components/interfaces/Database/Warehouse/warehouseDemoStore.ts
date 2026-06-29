import { proxy, useSnapshot } from 'valtio'

import {
  getSqlWarehouseRouting,
  getWarehouseQualifiedNamesFromSql,
  getWarehouseQualifiedTableName,
} from './warehouseNaming.utils'

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
export const DEMO_WAREHOUSE_LAG_SECONDS = 12

function warehouseQualifiedNameToTableKey(qualifiedName: string): string {
  const dotIndex = qualifiedName.indexOf('.')
  if (dotIndex === -1) return qualifiedName

  const schema = qualifiedName.slice(0, dotIndex)
  const table = qualifiedName.slice(dotIndex + 1)
  const sourceSchema = schema.endsWith('_warehouse')
    ? schema.slice(0, -'_warehouse'.length)
    : schema

  return `${sourceSchema}.${table}`
}

export function getSqlWarehouseLagSeconds(sql: string): number | undefined {
  if (getSqlWarehouseRouting(sql) === 'postgres') return undefined

  const qualifiedNames = getWarehouseQualifiedNamesFromSql(sql)
  const lagSeconds = qualifiedNames.map((qualifiedName) => {
    const tableKey = warehouseQualifiedNameToTableKey(qualifiedName)
    return warehouseDemoStore.tables[tableKey]?.lagSeconds
  })

  const knownLag = lagSeconds.filter((lag): lag is number => lag !== undefined)
  if (knownLag.length > 0) return Math.max(...knownLag)

  return DEMO_WAREHOUSE_LAG_SECONDS
}

export function setTableMode(key: string, mode: 'has_warehouse_copy'): void {
  const now = new Date().toISOString()

  warehouseDemoStore.tables[key] = {
    mode,
    warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
    syncState: 'live',
    lagSeconds: DEMO_WAREHOUSE_LAG_SECONDS,
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
