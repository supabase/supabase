// open the last table only on a fresh visit, and only when it belongs to an explicit schema
export function shouldOpenLastTableOnEditorIndex({
  isHistoryTraverse,
  explicitSchema,
  lastTableSchema,
}: {
  isHistoryTraverse: boolean
  explicitSchema?: string
  lastTableSchema?: string
}): boolean {
  if (isHistoryTraverse) {
    return false
  }

  const hasExplicitSchema = !!explicitSchema
  if (!hasExplicitSchema) {
    return true
  }

  return lastTableSchema === explicitSchema
}
