import { ident } from '../../../pg-format'

export const getEnableRLSSQL = ({ schema, table }: { schema: string; table: string }) => {
  return `ALTER TABLE ${ident(schema)}.${ident(table)} ENABLE ROW LEVEL SECURITY`
}
