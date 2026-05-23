import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getSequencesSQL = ({ schema }: { schema: string }): SafeSqlFragment => {
  return safeSql`
SELECT
  s.seqrelid::int8 AS id,
  n.nspname AS schema,
  c.relname AS name,
  r.rolname AS owner,
  format_type(s.seqtypid, NULL) AS data_type,
  s.seqstart AS start_value,
  s.seqincrement AS increment_by,
  s.seqmax AS max_value,
  s.seqmin AS min_value,
  s.seqcache AS cache_size,
  s.seqcycle AS cycle,
  obj_description(s.seqrelid, 'pg_class') AS comment,
  ps.last_value,
  dep.owner_table,
  dep.owner_column
FROM
  pg_sequence s
  JOIN pg_class c ON c.oid = s.seqrelid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  JOIN pg_roles r ON c.relowner = r.oid
  LEFT JOIN pg_sequences ps ON ps.schemaname = n.nspname AND ps.sequencename = c.relname
  LEFT JOIN LATERAL (
    SELECT dep_table.relname AS owner_table, dep_col.attname AS owner_column
    FROM pg_depend d
    JOIN pg_class dep_table ON dep_table.oid = d.refobjid
    LEFT JOIN pg_attribute dep_col ON dep_col.attrelid = d.refobjid AND dep_col.attnum = d.refobjsubid
    WHERE d.objid = s.seqrelid AND d.deptype IN ('a', 'i')
    LIMIT 1
  ) dep ON true
WHERE
  c.relkind = 'S'
  AND n.nspname = ${literal(schema)}
  AND (
    pg_has_role(c.relowner, 'USAGE')
    OR has_sequence_privilege(c.oid, 'SELECT, USAGE, UPDATE')
  )
ORDER BY
  c.relname
`
}
