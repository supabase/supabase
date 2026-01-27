import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { ident, literal } from './pg-format'
import { TABLE_PRIVILEGES_SQL } from './sql/table-privileges'

const pgTablePrivilegesZod = z.object({
  relation_id: z.number(),
  schema: z.string(),
  name: z.string(),
  kind: z.union([
    z.literal('table'),
    z.literal('view'),
    z.literal('materialized_view'),
    z.literal('foreign_table'),
    z.literal('partitioned_table'),
  ]),
  privileges: z.array(
    z.object({
      grantor: z.string(),
      grantee: z.string(),
      privilege_type: z.union([
        z.literal('SELECT'),
        z.literal('INSERT'),
        z.literal('UPDATE'),
        z.literal('DELETE'),
        z.literal('TRUNCATE'),
        z.literal('REFERENCES'),
        z.literal('TRIGGER'),
        z.literal('MAINTAIN'),
      ]),
      is_grantable: z.boolean(),
    })
  ),
})
const pgTablePrivilegesArrayZod = z.array(pgTablePrivilegesZod)
const pgTablePrivilegesOptionalZod = z.optional(pgTablePrivilegesZod)

function list({
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  limit,
  offset,
}: {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgTablePrivilegesArrayZod
} {
  let sql = `
with table_privileges as (${TABLE_PRIVILEGES_SQL})
select *
from table_privileges
`
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    sql += ` where schema ${filter}`
  }
  if (limit) {
    sql += ` limit ${limit}`
  }
  if (offset) {
    sql += ` offset ${offset}`
  }
  return {
    sql,
    zod: pgTablePrivilegesArrayZod,
  }
}

function retrieve({ id }: { id: number }): { sql: string; zod: typeof pgTablePrivilegesOptionalZod }
function retrieve({ name, schema }: { name: string; schema?: string }): {
  sql: string
  zod: typeof pgTablePrivilegesOptionalZod
}
function retrieve({
  id,
  name,
  schema = 'public',
}: {
  id?: number
  name?: string
  schema?: string
}): {
  sql: string
  zod: typeof pgTablePrivilegesOptionalZod
} {
  if (id) {
    const sql = /* SQL */ `
with table_privileges as (${TABLE_PRIVILEGES_SQL})
select *
from table_privileges
where table_privileges.relation_id = ${literal(id)};`
    return {
      sql,
      zod: pgTablePrivilegesOptionalZod,
    }
  } else {
    const sql = /* SQL */ `
with table_privileges as (${TABLE_PRIVILEGES_SQL})
select *
from table_privileges
where table_privileges.schema = ${literal(schema)}
  and table_privileges.name = ${literal(name)}
`
    return {
      sql,
      zod: pgTablePrivilegesOptionalZod,
    }
  }
}

type TablePrivilegesGrant = {
  relationId: number
  grantee: string
  privilegeType:
    | 'ALL'
    | 'SELECT'
    | 'INSERT'
    | 'UPDATE'
    | 'DELETE'
    | 'TRUNCATE'
    | 'REFERENCES'
    | 'TRIGGER'
    | 'MAINTAIN'
  isGrantable?: boolean
}
function grant(grants: TablePrivilegesGrant[]): { sql: string } {
  const sql = `
do $$
begin
${grants
  .map(
    ({ privilegeType, relationId, grantee, isGrantable }) =>
      `execute format('grant ${privilegeType} on table %s to ${
        grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)
      } ${isGrantable ? 'with grant option' : ''}', ${relationId}::regclass);`
  )
  .join('\n')}
end $$;
`
  return { sql }
}

type TablePrivilegesRevoke = {
  relationId: number
  grantee: string
  privilegeType:
    | 'ALL'
    | 'SELECT'
    | 'INSERT'
    | 'UPDATE'
    | 'DELETE'
    | 'TRUNCATE'
    | 'REFERENCES'
    | 'TRIGGER'
    | 'MAINTAIN'
}
function revoke(revokes: TablePrivilegesRevoke[]): { sql: string } {
  const sql = `
do $$
begin
${revokes
  .map(
    ({ privilegeType, relationId, grantee }) =>
      `execute format('revoke ${privilegeType} on table %s from ${grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)}', ${relationId}::regclass);`
  )
  .join('\n')}
end $$;
`
  return { sql }
}

export default {
  list,
  retrieve,
  grant,
  revoke,
  zod: pgTablePrivilegesZod,
}
