/**
 * TEMPORARY. Delete once Spark (turso) has `aclexplode` and runs `DO` blocks.
 *
 * `tablePrivileges.list` reads `relacl` as text and explodes it in TypeScript; pg-meta's privilege
 * filters are not applied. The grant and revoke statements Studio runs in a `DO` block are written
 * as plain statements on the table's name.
 */
import { toInt, type CatalogQuery } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import { ident, joinSqlFragments, keyword, safeSql, type SafeSqlFragment } from '../pg-format'
import {
  granteeSql,
  type TablePrivilegesGrant,
  type TablePrivilegesRevoke,
} from '../pg-meta-table-privileges'
import { explodeAcl } from './acl.fallback'

const KINDS: Record<string, string> = {
  r: 'table',
  v: 'view',
  m: 'materialized_view',
  f: 'foreign_table',
  p: 'partitioned_table',
}

/** Fallback for `tablePrivileges.list`. */
export async function listTablePrivilegesFallback(
  query: CatalogQuery,
  {
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
  }: { includeSystemSchemas?: boolean; includedSchemas?: string[]; excludedSchemas?: string[] } = {}
) {
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  const rows = await query(safeSql`
    select c.oid::int8 as relation_id, nc.nspname as schema, c.relname as name, c.relkind as kind,
      coalesce(c.relacl, acldefault('r', c.relowner))::text as acl
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace nc on nc.oid = c.relnamespace
    where c.relkind in ('r', 'v', 'm', 'f', 'p') ${filter ? safeSql`and nc.nspname ${filter}` : safeSql``}`)
  return rows.map((row) => ({
    relation_id: toInt(row.relation_id),
    schema: String(row.schema),
    name: String(row.name),
    kind: KINDS[String(row.kind)],
    privileges: explodeAcl(row.acl === null ? null : String(row.acl)),
  }))
}

/**
 * The statements of `tablePrivileges.grant` and `.revoke` for one table, without their `DO` block,
 * on its schema and name: no separate id lookup that a concurrent change could make stale.
 */
export function getTablePrivilegesStatementsSql({
  schema,
  name,
  grants,
  revokes,
}: {
  schema: string
  name: string
  grants: Array<Omit<TablePrivilegesGrant, 'relationId'>>
  revokes: Array<Omit<TablePrivilegesRevoke, 'relationId'>>
}): SafeSqlFragment {
  const table = safeSql`${ident(schema)}.${ident(name)}`
  const statements = [
    ...revokes.map(
      ({ privilegeType, grantee }) =>
        safeSql`revoke ${keyword(privilegeType)} on table ${table} from ${granteeSql(grantee)}`
    ),
    ...grants.map(
      ({ privilegeType, grantee, isGrantable }) =>
        safeSql`grant ${keyword(privilegeType)} on table ${table} to ${granteeSql(grantee)}${isGrantable ? safeSql` with grant option` : safeSql``}`
    ),
  ]
  return statements.length === 0 ? safeSql`` : safeSql`${joinSqlFragments(statements, ';\n')};`
}
