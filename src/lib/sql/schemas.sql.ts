import { literal } from 'pg-format'
import type { SQLQueryProps } from './common.js'

export const SCHEMAS_SQL = (
  props: SQLQueryProps & { nameFilter?: string; idsFilter?: string; includeSystemSchemas?: boolean }
) => /* SQL */ `
-- Adapted from information_schema.schemata
select
  n.oid::int8 as id,
  n.nspname as name,
  u.rolname as owner
from
  pg_namespace n,
  pg_roles u
where
  n.nspowner = u.oid
  ${props.idsFilter ? `and n.oid ${props.idsFilter}` : ''}
  ${props.nameFilter ? `and n.nspname ${props.nameFilter}` : ''}
  ${!props.includeSystemSchemas ? `and not pg_catalog.starts_with(n.nspname, 'pg_')` : ''}
  and (
    pg_has_role(n.nspowner, 'USAGE')
    or has_schema_privilege(n.oid, 'CREATE, USAGE')
  )
  and not pg_catalog.starts_with(n.nspname, 'pg_temp_')
  and not pg_catalog.starts_with(n.nspname, 'pg_toast_temp_')
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
