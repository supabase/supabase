import { formatWarehouseSize, type WarehouseSnapshot } from './warehouseDemoStore'

export function buildSnapshotQuerySql(tableKey: string, snapshot: WarehouseSnapshot): string {
  return `-- Query ${tableKey} at snapshot ${snapshot.id}
SELECT *
FROM ${tableKey}
FOR SYSTEM_TIME AS OF TIMESTAMPTZ '${snapshot.createdAt}';`
}

export function formatSnapshotLabel(snapshot: WarehouseSnapshot): string {
  return new Date(snapshot.createdAt).toLocaleString()
}

export function formatSnapshotSize(snapshot: WarehouseSnapshot): string {
  return formatWarehouseSize(snapshot.sizeBytes)
}
