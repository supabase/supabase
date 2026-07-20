import { literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'

export const WAREHOUSE_SCHEMA_SUFFIX = '_warehouse'

export function isWarehouseSchema(schema?: string | null): boolean {
  return schema?.endsWith(WAREHOUSE_SCHEMA_SUFFIX) ?? false
}

export function isWarehouseTimeTravelEnabled(
  schema?: string | null,
  snapshotTime?: string | null
): boolean {
  return isWarehouseSchema(schema) && !!snapshotTime
}

export function wrapWithWarehouseSnapshotTime({
  schema,
  snapshotTime,
  sql,
}: {
  schema?: string | null
  snapshotTime?: string | null
  sql: SafeSqlFragment
}): SafeSqlFragment {
  if (!isWarehouseTimeTravelEnabled(schema, snapshotTime)) return sql

  return safeSql`
SET LOCAL warehouse.snapshot_time = ${literal(snapshotTime)};
${sql}
`
}
