import { literal } from 'pg-format'
import type { SQLQueryPropsWithSchemaFilterAndIdsFilter } from './common.js'

export const VIEWS_SQL = (
  props: SQLQueryPropsWithSchemaFilterAndIdsFilter & {
    viewIdentifierFilter?: string
  }
) => /* SQL */ `
SELECT
  c.oid :: int8 AS id,
  n.nspname AS schema,
  c.relname AS name,
  -- See definition of information_schema.views
  (pg_relation_is_updatable(c.oid, false) & 20) = 20 AS is_updatable,
  obj_description(c.oid) AS comment
FROM
  pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
  ${props.schemaFilter ? `n.nspname ${props.schemaFilter} AND` : ''}
  ${props.idsFilter ? `c.oid ${props.idsFilter} AND` : ''}
  ${props.viewIdentifierFilter ? `(n.nspname || '.' || c.relname) ${props.viewIdentifierFilter} AND` : ''}
  c.relkind = 'v'
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
