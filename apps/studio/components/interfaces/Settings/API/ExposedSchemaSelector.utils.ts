/**
 * Computes the "{selectedCount} of {totalCount} schemas exposed" fraction shown in the
 * ExposedSchemaSelector trigger.
 *
 * Protected-but-exposed schemas (e.g. self-hosted's default `storage`, which exists in the
 * database but is filtered out of the selectable list) are folded into both sides so the
 * fraction matches the checked rows in the dropdown.
 *
 * Orphan schemas (exposed in config but absent from the database and not protected) are
 * intentionally excluded from both sides — they don't exist, so they shouldn't inflate the
 * total, even though they still render with a "does not exist" row.
 */
export function getExposedSchemaCounts({
  visibleSchemas,
  selectedSchemas,
  protectedSchemas,
}: {
  visibleSchemas: string[]
  selectedSchemas: string[]
  protectedSchemas: Set<string>
}): { selectedCount: number; totalCount: number } {
  const selectedSet = new Set(selectedSchemas)
  const visibleSet = new Set(visibleSchemas)

  const protectedExposedCount = selectedSchemas.filter(
    (schema) => !visibleSet.has(schema) && protectedSchemas.has(schema)
  ).length

  const selectedCount =
    visibleSchemas.filter((schema) => selectedSet.has(schema)).length + protectedExposedCount
  const totalCount = visibleSchemas.length + protectedExposedCount

  return { selectedCount, totalCount }
}
