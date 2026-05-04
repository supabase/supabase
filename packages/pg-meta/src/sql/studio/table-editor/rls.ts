import { ident, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getEnableRLSSQL = ({
  schema,
  table,
}: {
  schema: string
  table: string
}): SafeSqlFragment => {
  return safeSql`ALTER TABLE ${ident(schema)}.${ident(table)} ENABLE ROW LEVEL SECURITY`
}
