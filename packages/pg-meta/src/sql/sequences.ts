import { safeSql } from '../pg-format'

export const SEQUENCES_SQL = /* SQL */ safeSql`
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
    obj_description(s.seqrelid, 'pg_class') AS comment
  FROM
    pg_sequence s
    JOIN pg_class c ON c.oid = s.seqrelid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_roles r ON c.relowner = r.oid
  WHERE
    c.relkind = 'S'
    AND (
      pg_has_role(c.relowner, 'USAGE')
      OR has_sequence_privilege(c.oid, 'SELECT, USAGE, UPDATE')
    )
`
