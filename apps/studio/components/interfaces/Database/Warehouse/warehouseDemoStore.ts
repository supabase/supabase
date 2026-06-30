import { proxy, useSnapshot } from 'valtio'

import { getWarehouseQualifiedTableName } from './warehouseNaming.utils'

export type WarehouseMode = 'postgres' | 'has_warehouse_copy'
export type CopyStatus = 'backfilling' | 'live' | 'error'
export type ReplicationPhase = 'initial_sync' | 'streaming' | 'error'
export type PipelineStatus = 'live' | 'error'

/** @deprecated Use CopyStatus */
export type SyncState = CopyStatus

export interface WarehouseProjectReplicationStatus {
  replicationLagSeconds: number
  replicationPhase: ReplicationPhase
  pipelineStatus: PipelineStatus
}

export interface WarehouseTableState {
  mode: WarehouseMode
  copyStatus?: CopyStatus
  lastSyncedAt?: string
  copyName?: string
  warehouseSizeBytes?: number
}

export const warehouseDemoStore = proxy<{
  tables: Record<string, WarehouseTableState>
  catalogEnabled: boolean
  projectReplication: WarehouseProjectReplicationStatus | null
}>({
  tables: {},
  catalogEnabled: false,
  projectReplication: null,
})

const DEMO_WAREHOUSE_SIZE_BYTES = 197_912_092_672 // ~184 GB
const BACKFILLING_TRANSITION_MS = 4000

const DEFAULT_WAREHOUSE_COPY_FIELDS = {
  copyStatus: 'live' as const,
  warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
}

const DEFAULT_PROJECT_REPLICATION: WarehouseProjectReplicationStatus = {
  replicationLagSeconds: 12,
  replicationPhase: 'streaming',
  pipelineStatus: 'live',
}

export function repairProjectReplicationIfNeeded(): void {
  if (countLinkedWarehouseTablesInStore() === 0 || warehouseDemoStore.projectReplication) return

  warehouseDemoStore.projectReplication = {
    ...DEFAULT_PROJECT_REPLICATION,
    replicationPhase: 'streaming',
  }
}

export function getProjectReplicationLagSeconds(): number | undefined {
  if (warehouseDemoStore.projectReplication) {
    return warehouseDemoStore.projectReplication.replicationLagSeconds
  }
  if (countLinkedWarehouseTablesInStore() > 0) {
    return DEFAULT_PROJECT_REPLICATION.replicationLagSeconds
  }
  return undefined
}

function countLinkedWarehouseTablesInStore(): number {
  return Object.values(warehouseDemoStore.tables).filter(
    (table) => table.mode === 'has_warehouse_copy'
  ).length
}

function ensureProjectReplication(isFirstLinkedTable: boolean): void {
  if (warehouseDemoStore.projectReplication) return

  warehouseDemoStore.projectReplication = {
    ...DEFAULT_PROJECT_REPLICATION,
    replicationPhase: isFirstLinkedTable ? 'initial_sync' : 'streaming',
  }
}

export function countLinkedWarehouseTables(): number {
  return countLinkedWarehouseTablesInStore()
}

export function hasWarehouseTables(): boolean {
  return countLinkedWarehouseTablesInStore() > 0
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
    copyStatus: storedState.copyStatus ?? DEFAULT_WAREHOUSE_COPY_FIELDS.copyStatus,
    warehouseSizeBytes:
      storedState.warehouseSizeBytes ?? DEFAULT_WAREHOUSE_COPY_FIELDS.warehouseSizeBytes,
    lastSyncedAt: storedState.lastSyncedAt,
    copyName: storedState.copyName ?? getWarehouseQualifiedTableName(tableKey),
  }
}

export function setTableMode(key: string, mode: 'has_warehouse_copy'): void {
  const now = new Date().toISOString()
  const isFirstLinkedTable = countLinkedWarehouseTablesInStore() === 0

  ensureProjectReplication(isFirstLinkedTable)

  warehouseDemoStore.tables[key] = {
    mode,
    warehouseSizeBytes: DEMO_WAREHOUSE_SIZE_BYTES,
    copyStatus: 'backfilling',
    lastSyncedAt: now,
    copyName: getWarehouseQualifiedTableName(key),
  }

  setTimeout(() => {
    const table = warehouseDemoStore.tables[key]
    if (table?.copyStatus !== 'backfilling') return

    table.copyStatus = 'live'
    table.lastSyncedAt = new Date().toISOString()

    if (warehouseDemoStore.projectReplication?.replicationPhase === 'initial_sync') {
      warehouseDemoStore.projectReplication.replicationPhase = 'streaming'
    }
  }, BACKFILLING_TRANSITION_MS)
}

export function setTableCopyError(key: string): void {
  const table = warehouseDemoStore.tables[key]
  if (table?.mode !== 'has_warehouse_copy') return
  table.copyStatus = 'error'
}

export function clearTableCopyError(key: string): void {
  const table = warehouseDemoStore.tables[key]
  if (table?.copyStatus === 'error') {
    table.copyStatus = 'live'
    table.lastSyncedAt = new Date().toISOString()
  }
}

export function clearTableMode(key: string): void {
  delete warehouseDemoStore.tables[key]

  if (countLinkedWarehouseTablesInStore() === 0) {
    warehouseDemoStore.projectReplication = null
  }
}

export function setCatalogEnabled(enabled: boolean): void {
  warehouseDemoStore.catalogEnabled = enabled
}

export function useWarehouseTableState(tableKey: string): WarehouseTableState {
  const snap = useSnapshot(warehouseDemoStore)
  return (snap.tables[tableKey] as WarehouseTableState | undefined) ?? { mode: 'postgres' }
}

export function useProjectReplication(): WarehouseProjectReplicationStatus | null {
  const snap = useSnapshot(warehouseDemoStore)
  if (snap.projectReplication) {
    return snap.projectReplication as WarehouseProjectReplicationStatus
  }
  const hasLinkedTables = Object.values(snap.tables).some(
    (table) => table.mode === 'has_warehouse_copy'
  )
  if (hasLinkedTables) {
    return DEFAULT_PROJECT_REPLICATION
  }
  return null
}

export function formatWarehouseSize(bytes: number | undefined): string {
  if (bytes === undefined) return '184 GB'
  const gb = bytes / 1024 ** 3
  return `${Math.round(gb)} GB`
}

export function formatReplicationPhase(phase: ReplicationPhase): string {
  switch (phase) {
    case 'initial_sync':
      return 'Initial sync'
    case 'streaming':
      return 'Streaming'
    case 'error':
      return 'Error'
  }
}

export interface WarehouseStorageDisplay {
  postgresSize: string | null
  warehouseCopySize: string
}

export function getWarehouseStorageDisplay(
  state: Pick<WarehouseTableState, 'mode' | 'warehouseSizeBytes'> | undefined,
  postgresSize?: string
): WarehouseStorageDisplay | null {
  const mode = state?.mode ?? 'postgres'
  if (mode === 'postgres') return null

  return {
    postgresSize: postgresSize ?? null,
    warehouseCopySize: formatWarehouseSize(state?.warehouseSizeBytes),
  }
}

export function formatWarehouseStorageSummaryLabel(display: WarehouseStorageDisplay): string {
  const copyLabel = `Copy: ${display.warehouseCopySize}`

  if (display.postgresSize) {
    return `${display.postgresSize} (${copyLabel})`
  }

  return `(${copyLabel})`
}

export const WAREHOUSE_STORAGE_CELL_TOOLTIP =
  'This table has a Postgres heap for writes and a separate Warehouse copy for analytics. Open Storage to manage both.'

export function getWarehouseStorageSummaryLabel(
  state: Pick<WarehouseTableState, 'mode' | 'warehouseSizeBytes'> | undefined,
  postgresSize?: string
): string | null {
  const display = getWarehouseStorageDisplay(state, postgresSize)
  if (!display) return null
  return formatWarehouseStorageSummaryLabel(display)
}
