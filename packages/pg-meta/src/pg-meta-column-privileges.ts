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
import { COLUMN_PRIVILEGES_SQL } from './sql/column-privileges'

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
  limit,
  offset,
}: {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  columnIds?: string[]
  limit?: number
  offset?: number
} = {}): {
  sql: SafeSqlFragment
  zod: typeof pgColumnPrivilegesArrayZod
} {
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
execute format(
  'grant ${keyword(privilegeType)} (%I) on %s to ${
    grantee.toLowerCase() === 'public' ? safeSql`public` : ident(grantee)
  } ${isGrantable ? safeSql`with grant option` : safeSql``}',
  col.attname,
  col.attrelid::regclass
);`
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
execute format(
  'revoke ${keyword(privilegeType)} (%I) on %s from ${
    grantee.toLowerCase() === 'public' ? safeSql`public` : ident(grantee)
  }',
  col.attname,
  col.attrelid::regclass
);`
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
