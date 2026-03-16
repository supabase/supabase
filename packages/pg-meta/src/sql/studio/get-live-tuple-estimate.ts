import { literal } from '../../pg-format'

export const getLiveTupleEstimate = (table: string, schema: string = 'public') => {
  const sql = /* SQL */ `
SELECT n_live_tup AS live_tuple_estimate
FROM pg_stat_user_tables
WHERE schemaname = ${literal(schema)}
AND relname = ${literal(table)};
`.trim()

  return sql
}
