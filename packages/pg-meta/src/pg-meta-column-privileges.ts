import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { joinSqlFragments, keyword, literal, safeSql, type SafeSqlFragment } from './pg-format'
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

type ColumnPrivilegesGrant = z.infer<typeof privilegeGrant>
function getGranteeFormat(grantee: string): {
  format: SafeSqlFragment
  value: SafeSqlFragment
} {
  if (grantee === 'public') {
    return { format: safeSql`public`, value: safeSql`` }
  }

  // Keep the role name as a format argument rather than embedding its quoted
  // identifier in the format string. This preserves names containing apostrophes.
  return { format: safeSql`%I`, value: safeSql`, ${literal(grantee)}` }
}

function getDoBlockDelimiter(grantees: string[]): SafeSqlFragment {
  let suffix = 0
  while (true) {
    const delimiter = suffix === 0 ? safeSql`$pg_meta$` : safeSql`$pg_meta_${literal(suffix)}$`
    if (grantees.every((grantee) => !grantee.includes(delimiter))) {
      return delimiter
    }
    suffix += 1
  }
}

function grant(grants: ColumnPrivilegesGrant[]): { sql: SafeSqlFragment } {
  const doBlockDelimiter = getDoBlockDelimiter(grants.map(({ grantee }) => grantee))
  const sql = safeSql`
do ${doBlockDelimiter}
declare
  col record;
begin
${joinSqlFragments(
  grants.map(({ privilegeType, columnId, grantee, isGrantable }) => {
    const [relationId, columnNumber] = columnId.split('.')
    const granteeFormat = getGranteeFormat(grantee)
    return safeSql`
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(
  'grant ${keyword(privilegeType)} (%I) on %s to ${granteeFormat.format} ${
    isGrantable ? safeSql`with grant option` : safeSql``
  }',
  col.attname,
  col.attrelid::regclass${granteeFormat.value}
);`
  }),
  '\n'
)}
end ${doBlockDelimiter};
`
  return { sql }
}

type ColumnPrivilegesRevoke = Omit<ColumnPrivilegesGrant, 'isGrantable'>
function revoke(revokes: ColumnPrivilegesRevoke[]): { sql: SafeSqlFragment } {
  const doBlockDelimiter = getDoBlockDelimiter(revokes.map(({ grantee }) => grantee))
  const sql = safeSql`
do ${doBlockDelimiter}
declare
  col record;
begin
${joinSqlFragments(
  revokes.map(({ privilegeType, columnId, grantee }) => {
    const [relationId, columnNumber] = columnId.split('.')
    const granteeFormat = getGranteeFormat(grantee)
    return safeSql`
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(
  'revoke ${keyword(privilegeType)} (%I) on %s from ${granteeFormat.format}',
  col.attname,
  col.attrelid::regclass${granteeFormat.value}
);`
  }),
  '\n'
)}
end ${doBlockDelimiter};
`
  return { sql }
}

export default {
  list,
  grant,
  revoke,
  zod: pgColumnPrivilegesZod,
}
