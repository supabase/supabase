// open the last table only on a fresh visit, and only when it belongs to an explicit schema
export function shouldOpenLastTableOnEditorIndex({
  isHistoryTraverse,
  hasLastTable,
  explicitSchema,
  lastTableSchema,
}: {
  isHistoryTraverse: boolean
  hasLastTable: boolean
  explicitSchema?: string
  lastTableSchema?: string
}): boolean {
  if (!hasLastTable) {
    return false
  }

  if (isHistoryTraverse) {
    return false
  }

  const hasExplicitSchema = explicitSchema !== undefined && explicitSchema.length > 0
  if (!hasExplicitSchema) {
    return true
  }

  const lastTableBelongsToSchema = lastTableSchema === explicitSchema
  return lastTableBelongsToSchema
}
