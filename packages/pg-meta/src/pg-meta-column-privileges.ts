import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { ident, literal } from './pg-format'
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
  sql: string
  zod: typeof pgColumnPrivilegesArrayZod
} {
  let sql = `
  with column_privileges as (${COLUMN_PRIVILEGES_SQL})
  select *
  from column_privileges
  `

  const conditions: string[] = []

  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    conditions.push(`relation_schema ${filter}`)
  }

  if (columnIds?.length) {
    conditions.push(`column_id in (${columnIds.map(literal).join(',')})`)
  }

  if (conditions.length > 0) {
    sql += ` where ${conditions.join(' and ')}`
  }

  if (limit) {
    sql += ` limit ${limit}`
  }
  if (offset) {
    sql += ` offset ${offset}`
  }
  return {
    sql,
    zod: pgColumnPrivilegesArrayZod,
  }
}

type ColumnPrivilegesGrant = z.infer<typeof privilegeGrant>
function grant(grants: ColumnPrivilegesGrant[]): { sql: string } {
  const sql = `
do $$
declare
  col record;
begin
${grants
  .map(({ privilegeType, columnId, grantee, isGrantable }) => {
    const [relationId, columnNumber] = columnId.split('.')
    return `
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(
  'grant ${privilegeType} (%I) on %s to ${
    grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)
  } ${isGrantable ? 'with grant option' : ''}',
  col.attname,
  col.attrelid::regclass
);`
  })
  .join('\n')}
end $$;
`
  return { sql }
}

type ColumnPrivilegesRevoke = Omit<ColumnPrivilegesGrant, 'isGrantable'>
function revoke(revokes: ColumnPrivilegesRevoke[]): { sql: string } {
  const sql = `
do $$
declare
  col record;
begin
${revokes
  .map(({ privilegeType, columnId, grantee }) => {
    const [relationId, columnNumber] = columnId.split('.')
    return `
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(
  'revoke ${privilegeType} (%I) on %s from ${
    grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)
  }',
  col.attname,
  col.attrelid::regclass
);`
  })
  .join('\n')}
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
