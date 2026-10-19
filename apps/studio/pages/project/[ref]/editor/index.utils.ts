export function readExplicitSchemaQueryParam(
  schema: string | string[] | undefined
): string | undefined {
  const value = Array.isArray(schema) ? schema[0] : schema

  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  return value
}

/**
 * Open the last table only on a fresh visit. Back/Forward must stay where
 * history landed, and an explicit schema only redirects when that table
 * belongs to it.
 */
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
