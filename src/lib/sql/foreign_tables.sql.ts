import { literal } from 'pg-format'
import type { SQLQueryProps } from './common.js'

export const FOREIGN_TABLES_SQL = (
  props: SQLQueryProps & {
    schemaFilter?: string
    idsFilter?: string
    tableIdentifierFilter?: string
  }
) => /* SQL */ `
SELECT
  c.oid :: int8 AS id,
  n.nspname AS schema,
  c.relname AS name,
  obj_description(c.oid) AS comment
FROM
  pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
  ${props.schemaFilter ? `n.nspname ${props.schemaFilter} AND` : ''}
  ${props.idsFilter ? `c.oid ${props.idsFilter} AND` : ''}
  ${props.tableIdentifierFilter ? `(n.nspname || '.' || c.relname) ${props.tableIdentifierFilter} AND` : ''}
  c.relkind = 'f'
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
