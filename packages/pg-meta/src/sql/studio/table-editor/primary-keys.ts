import { ident, joinSqlFragments, safeSql, type SafeSqlFragment } from '../../../pg-format'

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
  columns: Array<string>
}): SafeSqlFragment => {
  const primaryKeyColumns = joinSqlFragments(columns.map(ident), ', ')
  return safeSql`ALTER TABLE ${ident(schema)}.${ident(table)} ADD PRIMARY KEY (${primaryKeyColumns})`
}
