import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from './pg-format'
import { COLUMN_PRIVILEGES_SQL, getScopedColumnPrivilegesSql } from './sql/column-privileges'

const pgColumnPrivilegeGrant = z.object({
  grantor: z.string(),
  grantee: z.string(),
  privilege_type: z.union([
    z.literal('SELECT'),
    z.literal('INSERT'),
    z.literal('UPDATE'),
    z.literal('REFERENCES'),
  ]),
  is_grantable: z.boolean(),
})
const pgColumnPrivilegesZod = z.object({
  column_id: z.string(),
  relation_schema: z.string(),
  relation_name: z.string(),
  column_name: z.string(),
  privileges: z.array(pgColumnPrivilegeGrant),
})
const pgColumnPrivilegesArrayZod = z.array(pgColumnPrivilegesZod)

const privilegeGrant = z.object({
  columnId: z.string(),
  grantee: z.string(),
  privilegeType: z.union([
    z.literal('ALL'),
    z.literal('SELECT'),
    z.literal('INSERT'),
    z.literal('UPDATE'),
    z.literal('REFERENCES'),
  ]),
  isGrantable: z.boolean().optional(),
})

function list({
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  columnIds,
  relationName,
  limit,
  offset,
  scoped = false,
}: {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  columnIds?: string[]
  /** Restricts to a single relation by name. Pair with `includedSchemas`. */
  relationName?: string
  limit?: number
  offset?: number
  scoped?: boolean
} = {}): {
  sql: SafeSqlFragment
  zod: typeof pgColumnPrivilegesArrayZod
} {
  // Scoped path: the base query prunes pg_class to the requested relations
  // before exploding ACLs across their columns, instead of exploding the whole
  // catalog and filtering the aggregate.
  if (scoped) {
    const base = getScopedColumnPrivilegesSql({
      includeSystemSchemas,
      includedSchemas,
      excludedSchemas,
      relationName,
      // `columnIds` are "<attrelid>.<attnum>" pairs. Their relation half narrows
      // the base scan; the exact attnum half stays an outer predicate below.
      relationIds: columnIds?.length
        ? [...new Set(columnIds.map((columnId) => columnId.split('.')[0]))]
        : undefined,
    })

    let sql = safeSql`
  with column_privileges as (${base})
  select *
  from column_privileges
  `
    if (columnIds?.length) {
      sql = safeSql`${sql} where column_id in (${joinSqlFragments(columnIds.map(literal), ',')})`
    }
    if (limit) {
      sql = safeSql`${sql} limit ${literal(limit)}`
    }
    if (offset) {
      sql = safeSql`${sql} offset ${literal(offset)}`
    }
    return {
      sql,
      zod: pgColumnPrivilegesArrayZod,
    }
  }

  let sql = safeSql`
  with column_privileges as (${COLUMN_PRIVILEGES_SQL})
  select *
  from column_privileges
  `

  const conditions: SafeSqlFragment[] = []

  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    conditions.push(safeSql`relation_schema ${filter}`)
  }

  if (relationName) {
    conditions.push(safeSql`relation_name = ${literal(relationName)}`)
  }

  if (columnIds?.length) {
    conditions.push(safeSql`column_id in (${joinSqlFragments(columnIds.map(literal), ',')})`)
  }

  if (conditions.length > 0) {
    sql = safeSql`${sql} where ${joinSqlFragments(conditions, ' and ')}`
  }

  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgColumnPrivilegesArrayZod,
  }
}

/**
 * The `%I.%I` arguments of a `format()` call that name the table of the
 * `col` record (a `pg_attribute` row): its schema and name.
 *
 * `%s` with `col.attrelid::regclass` would build the same statement, but `%s`
 * substitutes raw text, so a server that statically checks `DO` blocks (such as
 * Multigres) can't prove the statement fixed and rejects the block. A format
 * string made only of `%I`/`%L` conversions can be checked.
 */
const colRelationIdentArgs = safeSql`(select n.nspname from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.oid = col.attrelid), (select relname from pg_class where oid = col.attrelid)`

function granteeSql(grantee: string): SafeSqlFragment {
  return grantee.toLowerCase() === 'public' ? safeSql`public` : ident(grantee)
}

type ColumnPrivilegesGrant = z.infer<typeof privilegeGrant>
function grant(grants: ColumnPrivilegesGrant[]): { sql: SafeSqlFragment } {
  const sql = safeSql`
do $$
declare
  col record;
begin
${joinSqlFragments(
  grants.map(({ privilegeType, columnId, grantee, isGrantable }) => {
    const [relationId, columnNumber] = columnId.split('.')
    return safeSql`
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(${literal(
      `grant ${keyword(privilegeType)} (%I) on %I.%I to ${granteeSql(grantee)}${
        isGrantable ? ' with grant option' : ''
      }`
    )}, col.attname, ${colRelationIdentArgs});`
  }),
  '\n'
)}
end $$;
`
  return { sql }
}

type ColumnPrivilegesRevoke = Omit<ColumnPrivilegesGrant, 'isGrantable'>
function revoke(revokes: ColumnPrivilegesRevoke[]): { sql: SafeSqlFragment } {
  const sql = safeSql`
do $$
declare
  col record;
begin
${joinSqlFragments(
  revokes.map(({ privilegeType, columnId, grantee }) => {
    const [relationId, columnNumber] = columnId.split('.')
    return safeSql`
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(${literal(
      `revoke ${keyword(privilegeType)} (%I) on %I.%I from ${granteeSql(grantee)}`
    )}, col.attname, ${colRelationIdentArgs});`
  }),
  '\n'
)}
end $$;
`
  return { sql }
}

export default {
  list,
  grant,
  revoke,
  zod: pgColumnPrivilegesZod,
}
