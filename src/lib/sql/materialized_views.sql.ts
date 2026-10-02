import { literal } from 'pg-format'
import type { SQLQueryPropsWithSchemaFilterAndIdsFilter } from './common.js'

export const MATERIALIZED_VIEWS_SQL = (
  props: SQLQueryPropsWithSchemaFilterAndIdsFilter & {
    materializedViewIdentifierFilter?: string
  }
) => /* SQL */ `
select
  c.oid::int8 as id,
  n.nspname as schema,
  c.relname as name,
  c.relispopulated as is_populated,
  obj_description(c.oid) as comment
from
  pg_class c
  join pg_namespace n on n.oid = c.relnamespace
where
  ${props.schemaFilter ? `n.nspname ${props.schemaFilter} AND` : ''}
  ${props.idsFilter ? `c.oid ${props.idsFilter} AND` : ''}
  ${props.materializedViewIdentifierFilter ? `(n.nspname || '.' || c.relname) ${props.materializedViewIdentifierFilter} AND` : ''}
  c.relkind = 'm'
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
