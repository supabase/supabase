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
import { POLICIES_SQL } from './sql/policies'

const pgPolicyZod = z.object({
  id: z.number(),
  schema: z.string(),
  table: z.string(),
  table_id: z.number(),
  name: z.string(),
  action: z.union([z.literal('PERMISSIVE'), z.literal('RESTRICTIVE')]),
  roles: z.array(z.string()),
  command: z.union([
    z.literal('SELECT'),
    z.literal('INSERT'),
    z.literal('UPDATE'),
    z.literal('DELETE'),
    z.literal('ALL'),
  ]),
  definition: z.union([z.string(), z.null()]),
  check: z.union([z.string(), z.null()]),
})
const pgPolicyArrayZod = z.array(pgPolicyZod)
const pgPolicyOptionalZod = z.optional(pgPolicyZod)

export type PGPolicy = z.infer<typeof pgPolicyZod>

type PolicyIdentifier = Pick<PGPolicy, 'id'> | Pick<PGPolicy, 'name' | 'schema' | 'table'>

function getIdentifierWhereClause(identifier: PolicyIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`id = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name && identifier.schema && identifier.table) {
    return safeSql`name = ${literal(identifier.name)} AND schema = ${literal(identifier.schema)} AND table = ${literal(identifier.table)}`
  }
  throw new Error('Must provide either id or name, schema and table')
}

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
  zod: typeof pgPolicyArrayZod
} {
  let sql = safeSql`
    with policies as (${POLICIES_SQL})
    select *
    from policies
    `
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    sql = safeSql`${sql}where schema ${filter}`
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgPolicyArrayZod,
  }
}

function retrieve(identifier: PolicyIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgPolicyOptionalZod
} {
  const sql = safeSql`with policies as (${POLICIES_SQL}) select * from policies where ${getIdentifierWhereClause(identifier)};`
  return {
    sql,
    zod: pgPolicyOptionalZod,
  }
}

type PolicyCreateParams = {
  name: string
  schema?: string
  table: string
  definition?: SafeSqlFragment
  check?: SafeSqlFragment
  action?: 'PERMISSIVE' | 'RESTRICTIVE'
  command?: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  roles?: string[]
}

function create({
  name,
  schema = 'public',
  table,
  definition,
  check,
  action = 'PERMISSIVE',
  command = 'ALL',
  roles = ['public'],
}: PolicyCreateParams): { sql: SafeSqlFragment } {
  const rolesFragment = joinSqlFragments(roles.map(ident), ', ')
  const definitionSql = definition ? safeSql`using (${definition})` : safeSql``
  const checkSql = check ? safeSql`with check (${check})` : safeSql``
  const sql = safeSql`
create policy ${ident(name)} on ${ident(schema)}.${ident(table)}
  as ${keyword(action)}
  for ${keyword(command)}
  to ${rolesFragment}
  ${definitionSql}
  ${checkSql};`
  return { sql }
}

type PolicyUpdateParams = {
  name?: string
  definition?: SafeSqlFragment
  check?: SafeSqlFragment
  roles?: string[]
}

function update(
  identifier: Pick<PGPolicy, 'name' | 'schema' | 'table'>,
  params: PolicyUpdateParams
): { sql: SafeSqlFragment } {
  const { name, definition, check, roles } = params

  const alter = safeSql`ALTER POLICY ${ident(identifier.name)} ON ${ident(identifier.schema)}.${ident(identifier.table)}`
  const nameSql: SafeSqlFragment =
    name === undefined ? safeSql`` : safeSql`${alter} RENAME TO ${ident(name)};`
  const definitionSql: SafeSqlFragment =
    definition === undefined ? safeSql`` : safeSql`${alter} USING (${definition});`
  const checkSql: SafeSqlFragment =
    check === undefined ? safeSql`` : safeSql`${alter} WITH CHECK (${check});`
  const rolesSql: SafeSqlFragment =
    roles === undefined
      ? safeSql``
      : safeSql`${alter} TO ${joinSqlFragments(roles.map(ident), ', ')};`

  // nameSql must be last
  const sql = safeSql`BEGIN; ${definitionSql} ${checkSql} ${rolesSql} ${nameSql} COMMIT;`

  return { sql }
}

function remove(identifier: Pick<PGPolicy, 'name' | 'schema' | 'table'>): { sql: SafeSqlFragment } {
  const sql = safeSql`DROP POLICY ${ident(identifier.name)} ON ${ident(identifier.schema)}.${ident(identifier.table)};`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgPolicyZod,
}
