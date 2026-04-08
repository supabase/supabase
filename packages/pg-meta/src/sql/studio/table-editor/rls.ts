import { ident } from '../../../pg-format'

export const getEnableRLSSQL = ({ schema, table }: { schema: string; table: string }) => {
  return `-- source: dashboard\n-- description: Enable row level security on a table\nALTER TABLE ${ident(schema)}.${ident(table)} ENABLE ROW LEVEL SECURITY`
}
