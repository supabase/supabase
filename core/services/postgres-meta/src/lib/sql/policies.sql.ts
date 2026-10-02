import { literal } from 'pg-format'
import type { SQLQueryPropsWithSchemaFilterAndIdsFilter } from './common.js'

export const POLICIES_SQL = (
  props: SQLQueryPropsWithSchemaFilterAndIdsFilter & { functionNameIdentifierFilter?: string }
) => /* SQL */ `
SELECT
  pol.oid :: int8 AS id,
  n.nspname AS schema,
  c.relname AS table,
  c.oid :: int8 AS table_id,
  pol.polname AS name,
  CASE
    WHEN pol.polpermissive THEN 'PERMISSIVE' :: text
    ELSE 'RESTRICTIVE' :: text
  END AS action,
  CASE
    WHEN pol.polroles = '{0}' :: oid [] THEN array_to_json(
      string_to_array('public' :: text, '' :: text) :: name []
    )
    ELSE array_to_json(
      ARRAY(
        SELECT
          pg_roles.rolname
        FROM
          pg_roles
        WHERE
          pg_roles.oid = ANY (pol.polroles)
        ORDER BY
          pg_roles.rolname
      )
    )
  END AS roles,
  CASE
    pol.polcmd
    WHEN 'r' :: "char" THEN 'SELECT' :: text
    WHEN 'a' :: "char" THEN 'INSERT' :: text
    WHEN 'w' :: "char" THEN 'UPDATE' :: text
    WHEN 'd' :: "char" THEN 'DELETE' :: text
    WHEN '*' :: "char" THEN 'ALL' :: text
    ELSE NULL :: text
  END AS command,
  pg_get_expr(pol.polqual, pol.polrelid) AS definition,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS check
FROM
  pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
  ${props.schemaFilter ? `n.nspname ${props.schemaFilter}` : 'true'}
  ${props.idsFilter ? `AND pol.oid ${props.idsFilter}` : ''}
  ${props.functionNameIdentifierFilter ? `AND (c.relname || '.' || pol.polname) ${props.functionNameIdentifierFilter}` : ''}
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
