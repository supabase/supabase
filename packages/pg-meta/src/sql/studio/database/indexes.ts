import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getIndexesSQL = ({ schema }: { schema: string }): SafeSqlFragment => {
  return safeSql`
SELECT
  n.nspname        AS schema,
  t.relname        AS "table",
  i.relname        AS name,
  pg_get_indexdef(idx.indexrelid) AS definition,
  STRING_AGG(
    COALESCE(a.attname, '(expression)'),
    ', ' ORDER BY k.ord
  ) AS columns
FROM pg_index idx
JOIN pg_class      t ON t.oid = idx.indrelid
JOIN pg_class      i ON i.oid = idx.indexrelid
JOIN pg_namespace  n ON n.oid = t.relnamespace
JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
LEFT JOIN pg_attribute a
  ON a.attrelid = t.oid
 AND a.attnum   = k.attnum
WHERE n.nspname = ${literal(schema)}
GROUP BY
  n.nspname,
  t.relname,
  i.relname,
  idx.indexrelid
ORDER BY
  schema, "table", name;
`
}
