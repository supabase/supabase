/**
 * The functions below are basically just queries but may be supported directly
 * from the pg-meta library in the future
 */
export const getAddPrimaryKeySQL = ({
  schema,
  table,
  columns,
}: {
  schema: string
  table: string
  columns: string[]
}) => {
  const primaryKeyColumns = columns.map((col) => `"${col}"`).join(', ')
  return `ALTER TABLE "${schema}"."${table}" ADD PRIMARY KEY (${primaryKeyColumns})`
}
