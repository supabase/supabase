export type TableSyncCopyConfig =
  | { type: 'include_all_tables' }
  | { type: 'skip_all_tables' }
  | { type: 'include_tables'; table_ids: number[] }
  | { type: 'skip_tables'; table_ids: number[] }

export type ReplicationTableIdentity = {
  id: number
  schema: string
  name: string
}

export type TableCopyEstimate = {
  schema: string
  name: string
  estimated_bytes: number
  estimated_cost: number
  is_row_filtered: boolean
}

export const shouldCopyTable = (
  config: TableSyncCopyConfig | null | undefined,
  tableId: number
) => {
  const resolvedConfig: TableSyncCopyConfig = config ?? { type: 'include_all_tables' }

  switch (resolvedConfig.type) {
    case 'include_all_tables':
      return true
    case 'skip_all_tables':
      return false
    case 'include_tables':
      return resolvedConfig.table_ids.includes(tableId)
    case 'skip_tables':
      return !resolvedConfig.table_ids.includes(tableId)
  }
}

export const getTableCopyTargets = <T extends { id: number }>(
  tables: readonly T[],
  config: TableSyncCopyConfig | null | undefined
) => tables.filter(({ id }) => shouldCopyTable(config, id))

const getTableIdentityKey = ({ schema, name }: { schema: string; name: string }) =>
  JSON.stringify([schema, name])

export const summarizeTableCopyEstimate = (
  estimates: readonly TableCopyEstimate[],
  targets: readonly Pick<ReplicationTableIdentity, 'schema' | 'name'>[]
) => {
  const estimatesByIdentity = new Map(
    estimates.map((estimate) => [getTableIdentityKey(estimate), estimate])
  )
  const matchedTables = targets.flatMap((target) => {
    const estimate = estimatesByIdentity.get(getTableIdentityKey(target))
    return estimate === undefined ? [] : [estimate]
  })

  return {
    isComplete: matchedTables.length === targets.length,
    tables: matchedTables,
    estimatedBytes: matchedTables.reduce((total, table) => total + table.estimated_bytes, 0),
    estimatedCost: matchedTables.reduce((total, table) => total + table.estimated_cost, 0),
    hasRowFilteredTables: matchedTables.some((table) => table.is_row_filtered),
  }
}
