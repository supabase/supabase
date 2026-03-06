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

export const getCheckPrimaryKeysExistsSQL = (tables: { name: string; schema: string }[]) => {
  const formattedTables = tables.map((table) => `'${table.schema}.${table.name}'`).join(',')

  return /* SQL */ `
WITH targets(rel) AS (
  SELECT unnest(ARRAY[${formattedTables}]::regclass[])
)
SELECT
  c.oid AS id,
  n.nspname AS schema,
  c.relname AS name,
  (con.conrelid IS NOT NULL) AS has_primary_key
FROM targets t
JOIN pg_class c ON c.oid = t.rel
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_constraint con
  ON con.conrelid = c.oid AND con.contype = 'p'
ORDER BY n.nspname, c.relname;
`
}
