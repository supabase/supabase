export type PublicationTableConfig = {
  id: number
  columns?: string[] | null
}

export type SourceTableWithPartitionParent = {
  id: number
  partition_parent_id?: number | null
}

// `undefined` means the nearest configured publication entry includes every column. `null`
// means the ancestry could not be resolved safely, so the UI must not claim any configured
// column is still valid.
export const resolvePublishedColumnNames = (
  tableId: number,
  configuredTablesById: ReadonlyMap<number, PublicationTableConfig>,
  sourceTablesById: ReadonlyMap<number, SourceTableWithPartitionParent>
): Set<string> | null | undefined => {
  const visitedTableIds = new Set<number>()
  let currentTableId: number | null | undefined = tableId

  while (currentTableId !== null && currentTableId !== undefined) {
    if (visitedTableIds.has(currentTableId)) return null
    visitedTableIds.add(currentTableId)

    const configuredTable = configuredTablesById.get(currentTableId)
    if (configuredTable) {
      return configuredTable.columns === null || configuredTable.columns === undefined
        ? undefined
        : new Set(configuredTable.columns)
    }

    const sourceTable = sourceTablesById.get(currentTableId)
    if (!sourceTable) return null
    currentTableId = sourceTable.partition_parent_id
  }

  return null
}
