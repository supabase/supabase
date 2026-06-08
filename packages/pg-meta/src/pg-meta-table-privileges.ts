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
  sql: SafeSqlFragment
  zod: typeof pgTablePrivilegesArrayZod
} {
  let sql = safeSql`
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
    sql = safeSql`${sql} where schema ${filter}`
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgTablePrivilegesArrayZod,
  }
}

function retrieve({ id }: { id: number }): {
  sql: SafeSqlFragment
  zod: typeof pgTablePrivilegesOptionalZod
}
function retrieve({ name, schema }: { name: string; schema?: string }): {
  sql: SafeSqlFragment
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
  sql: SafeSqlFragment
  zod: typeof pgTablePrivilegesOptionalZod
} {
  if (id) {
    const sql = /* SQL */ safeSql`
with table_privileges as (${TABLE_PRIVILEGES_SQL})
select *
from table_privileges
where table_privileges.relation_id = ${literal(id)};`
    return {
      sql,
      zod: pgTablePrivilegesOptionalZod,
    }
  } else {
    const sql = /* SQL */ safeSql`
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
function grant(grants: TablePrivilegesGrant[]): { sql: SafeSqlFragment } {
  const sql = safeSql`
do $$
begin
${joinSqlFragments(
  grants.map(
    ({ privilegeType, relationId, grantee, isGrantable }) =>
      safeSql`execute format('grant ${keyword(privilegeType)} on table %s to ${
        grantee.toLowerCase() === 'public' ? safeSql`public` : ident(grantee)
      } ${isGrantable ? safeSql`with grant option` : safeSql``}', ${literal(relationId)}::regclass);`
  ),
  '\n'
)}
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
function revoke(revokes: TablePrivilegesRevoke[]): { sql: SafeSqlFragment } {
  const sql = safeSql`
do $$
begin
${joinSqlFragments(
  revokes.map(
    ({ privilegeType, relationId, grantee }) =>
      safeSql`execute format('revoke ${keyword(privilegeType)} on table %s from ${
        grantee.toLowerCase() === 'public' ? safeSql`public` : ident(grantee)
      }', ${literal(relationId)}::regclass);`
  ),
  '\n'
)}
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
