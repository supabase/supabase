export const getEnableRLSSQL = ({ schema, table }: { schema: string; table: string }) => {
  return `ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY`
}
