import { ident } from '../../../pg-format'

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
  const primaryKeyColumns = columns.map((col) => ident(col)).join(', ')
  return `-- source: dashboard\n-- description: Add a primary key constraint to a table\nALTER TABLE ${ident(schema)}.${ident(table)} ADD PRIMARY KEY (${primaryKeyColumns})`
}
