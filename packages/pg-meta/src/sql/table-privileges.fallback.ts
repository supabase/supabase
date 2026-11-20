/**
 * TEMPORARY. Delete once Spark (turso) has `aclexplode` and runs `DO` blocks.
 *
 * `tablePrivileges.list` reads `relacl` as text and explodes it in TypeScript; pg-meta's privilege
 * filters are not applied. The grant and revoke statements Studio runs in a `DO` block are written
 * as plain statements.
 */
import { toInt, type CatalogQuery } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '../pg-format'
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

/** The statements of `tablePrivileges.grant` and `.revoke`, without their `DO` block. */
export async function getTablePrivilegesStatementsFallback(
  query: CatalogQuery,
  { grants, revokes }: { grants: TablePrivilegesGrant[]; revokes: TablePrivilegesRevoke[] }
): Promise<SafeSqlFragment> {
  const ids = [...new Set([...grants, ...revokes].map((change) => change.relationId))]
  if (ids.length === 0) return safeSql``
  const rows = await query(safeSql`
    select c.oid::int8 as id, n.nspname as schema, c.relname as name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where c.oid in (${joinSqlFragments(ids.map(literal), ', ')})`)
  const relations = new Map(
    rows.map((row) => [
      toInt(row.id),
      safeSql`${ident(String(row.schema))}.${ident(String(row.name))}`,
    ])
  )
  const relation = (id: number) => {
    const name = relations.get(id)
    if (!name) throw new Error(`relation ${id} does not exist`)
    return name
  }
  const statements = [
    ...revokes.map(
      ({ privilegeType, relationId, grantee }) =>
        safeSql`revoke ${keyword(privilegeType)} on table ${relation(relationId)} from ${granteeSql(grantee)}`
    ),
    ...grants.map(
      ({ privilegeType, relationId, grantee, isGrantable }) =>
        safeSql`grant ${keyword(privilegeType)} on table ${relation(relationId)} to ${granteeSql(grantee)}${isGrantable ? safeSql` with grant option` : safeSql``}`
    ),
  ]
  return safeSql`${joinSqlFragments(statements, ';\n')};`
}
