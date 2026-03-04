import { literal } from '@supabase/pg-meta/src/pg-format'

import { sqlKeys } from '../sql/keys'

export const getLiveTupleEstimate = (table: string, schema: string = 'public') => {
  const sql = /* SQL */ `
SELECT n_live_tup AS live_tuple_estimate
FROM pg_stat_user_tables
WHERE schemaname = ${literal(schema)}
AND relname = ${literal(table)};
`.trim()

  return sql
}

export const getLiveTupleEstimateKey = (
  projectRef: string | undefined,
  table: string,
  schema = 'public'
) => sqlKeys.query(projectRef, ['live-tuple-estimate', schema, table])
