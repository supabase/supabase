import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../pg-format'

export type ColumnPrivilegesScope = {
  /** Defaults to false, which excludes {@link DEFAULT_SYSTEM_SCHEMAS}. */
  includeSystemSchemas?: boolean
  includedSchemas?: Array<string>
  excludedSchemas?: Array<string>
  /** Restricts to a single relation by name. Pair with `includedSchemas`. */
  relationName?: string
  /** Restricts to specific relations by oid. */
  relationIds?: Array<string>
}

/**
 * Column ACLs. Prunes pg_class/pg_namespace in the `rel` CTE first so the
 * scope predicate can drive an index scan.
 */
export const getScopedColumnPrivilegesSql = ({
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  relationName,
  relationIds,
}: ColumnPrivilegesScope = {}): SafeSqlFragment => {
  const conditions: Array<SafeSqlFragment> = []

  const schemaFilter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (schemaFilter) {
    conditions.push(safeSql`and nc.nspname ${schemaFilter}`)
  }
  if (relationName) {
    conditions.push(safeSql`and c.relname = ${literal(relationName)}`)
  }
  if (relationIds?.length) {
    conditions.push(safeSql`and c.oid in (${joinSqlFragments(relationIds.map(literal), ',')})`)
  }
  const scopeFilter = joinSqlFragments(conditions, '\n')

  return safeSql`
with rel as (
  select
    c.oid,
    c.relname,
    c.relowner,
    c.relacl,
    nc.nspname
  from pg_class c
  join pg_namespace nc
    on nc.oid = c.relnamespace
  where c.relkind = any (array['r', 'v', 'm', 'f', 'p'])
    ${scopeFilter}
),
roles as (
  select
    r.oid,
    r.rolname,
    pg_has_role(r.oid, 'USAGE') as is_member
  from pg_authid r
),
grantees as (
  select oid, rolname, is_member, false as is_public from roles
  union all
  select (0)::oid as oid, 'PUBLIC', false, true
),
priv as (
  -- Table-level ACLs apply to every live column of the relation.
  select
    a.attrelid,
    a.attnum,
    a.attname,
    r.relname,
    r.nspname,
    p.grantor,
    p.grantee,
    p.privilege_type as prtype,
    p.is_grantable as grantable
  from rel r
  cross join lateral aclexplode(coalesce(r.relacl, acldefault('r', r.relowner))) p
  join pg_attribute a
    on a.attrelid = r.oid
    and a.attnum > 0
    and not a.attisdropped
  where p.privilege_type = any (array['INSERT', 'SELECT', 'UPDATE', 'REFERENCES'])

  union

  -- Column-level ACLs.
  select
    a.attrelid,
    a.attnum,
    a.attname,
    r.relname,
    r.nspname,
    p.grantor,
    p.grantee,
    p.privilege_type,
    p.is_grantable
  from rel r
  join pg_attribute a
    on a.attrelid = r.oid
    and a.attnum > 0
    and not a.attisdropped
  cross join lateral aclexplode(coalesce(a.attacl, acldefault('c', r.relowner))) p
  where a.attacl is not null
    and p.privilege_type = any (array['INSERT', 'SELECT', 'UPDATE', 'REFERENCES'])
)
select
  (p.attrelid || '.' || p.attnum) as column_id,
  p.nspname as relation_schema,
  p.relname as relation_name,
  p.attname as column_name,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'grantor', grantor.rolname,
        'grantee', grantee.rolname,
        'privilege_type', p.prtype,
        'is_grantable', p.grantable
      )
    ),
    '[]'
  ) as privileges
from priv p
join roles grantor
  on grantor.oid = p.grantor
join grantees grantee
  on grantee.oid = p.grantee
where grantor.is_member
   or grantee.is_member
   or grantee.is_public
group by
  p.attrelid,
  p.attnum,
  p.nspname,
  p.relname,
  p.attname
`
}
