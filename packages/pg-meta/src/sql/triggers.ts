import { safeSql } from '../pg-format'

export const TRIGGERS_SQL = /* SQL */ safeSql`
SELECT
  pg_t.oid AS id,
  pg_t.tgrelid AS table_id,
  CASE
    WHEN pg_t.tgenabled = 'D' THEN 'DISABLED'
    WHEN pg_t.tgenabled = 'O' THEN 'ORIGIN'
    WHEN pg_t.tgenabled = 'R' THEN 'REPLICA'
    WHEN pg_t.tgenabled = 'A' THEN 'ALWAYS'
  END AS enabled_mode,
  (
    STRING_TO_ARRAY(
      ENCODE(pg_t.tgargs, 'escape'), '\\000'
    )
  )[:pg_t.tgnargs] AS function_args,
  pg_t.tgname AS name,
  pg_c.relname AS table,
  table_ns.nspname AS schema,
  -- The columns below are derived the same way as in information_schema.triggers,
  -- which can't be used directly because it has no rows for TRUNCATE events.
  CASE
    WHEN pg_has_role(pg_c.relowner, 'USAGE')
    THEN (regexp_match(pg_get_triggerdef(pg_t.oid), '.{35,} WHEN \\((.+)\\) EXECUTE FUNCTION'))[1]
  END AS condition,
  CASE pg_t.tgtype::integer & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END AS orientation,
  CASE pg_t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS activation,
  ARRAY_REMOVE(
    ARRAY[
      CASE WHEN pg_t.tgtype::integer & 4 <> 0 THEN 'INSERT' END,
      CASE WHEN pg_t.tgtype::integer & 8 <> 0 THEN 'DELETE' END,
      CASE WHEN pg_t.tgtype::integer & 16 <> 0 THEN 'UPDATE' END,
      CASE WHEN pg_t.tgtype::integer & 32 <> 0 THEN 'TRUNCATE' END
    ],
    NULL
  )::text[] AS events,
  pg_p.proname AS function_name,
  pg_n.nspname AS function_schema
FROM
  pg_trigger AS pg_t
JOIN
  pg_class AS pg_c
ON pg_t.tgrelid = pg_c.oid
JOIN pg_namespace AS table_ns
ON pg_c.relnamespace = table_ns.oid
JOIN pg_proc AS pg_p
ON pg_t.tgfoid = pg_p.oid
JOIN pg_namespace AS pg_n
ON pg_p.pronamespace = pg_n.oid
WHERE
  NOT pg_t.tgisinternal
  AND NOT pg_is_other_temp_schema(table_ns.oid)
  AND (
    pg_has_role(pg_c.relowner, 'USAGE')
    OR has_table_privilege(pg_c.oid, 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    OR has_any_column_privilege(pg_c.oid, 'INSERT, UPDATE, REFERENCES')
  )
`
