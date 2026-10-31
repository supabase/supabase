export function isColumnMasked(
  columnKey: string,
  sensitiveDataColumns: Set<string>,
  temporarilyRevealedColumns: Set<string>
): boolean {
  return sensitiveDataColumns.has(columnKey) && !temporarilyRevealedColumns.has(columnKey)
}
