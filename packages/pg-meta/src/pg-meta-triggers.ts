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
import { TRIGGERS_SQL } from './sql/triggers'

type TriggerIdentifier = Pick<PGTrigger, 'id'> | Pick<PGTrigger, 'name' | 'schema' | 'table'>

function getIdentifierWhereClause(identifier: TriggerIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.table && identifier.schema) {
    return safeSql`${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)} and ${ident('table')} = ${literal(identifier.table)}`
  }
  throw new Error('Must provide either id or name, schema and table')
}

export const pgTriggerZod = z.object({
  id: z.number(),
  table_id: z.number(),
  enabled_mode: z.enum(['DISABLED', 'ORIGIN', 'REPLICA', 'ALWAYS']),
  function_args: z.array(z.string()),
  name: z.string(),
  table: z.string(),
  schema: z.string(),
  condition: z.string().nullable(),
  orientation: z.enum(['ROW', 'STATEMENT']),
  activation: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF']),
  events: z.array(z.string()),
  function_name: z.string(),
  function_schema: z.string(),
})

export type PGTrigger = z.infer<typeof pgTriggerZod>

export const pgTriggerArrayZod = z.array(pgTriggerZod)
export const pgTriggerOptionalZod = z.optional(pgTriggerZod)

export function list({
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
  zod: typeof pgTriggerArrayZod
} {
  let sql = safeSql`with triggers as (${TRIGGERS_SQL}) select * from triggers`
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
    zod: pgTriggerArrayZod,
  }
}

type TriggersRetrieveReturn = {
  sql: SafeSqlFragment
  zod: typeof pgTriggerOptionalZod
}

export function retrieve(identifier: TriggerIdentifier): TriggersRetrieveReturn
export function retrieve(params: TriggerIdentifier): TriggersRetrieveReturn {
  const whereIdentifierCondition = getIdentifierWhereClause(params)
  const sql = safeSql`with triggers as (${TRIGGERS_SQL}) select * from triggers where ${whereIdentifierCondition};`
  return {
    sql,
    zod: pgTriggerOptionalZod,
  }
}

export const pgTriggerCreateZod = z.object({
  name: z.string(),
  schema: z.string().optional().default('public'),
  table: z.string(),
  function_schema: z.string().optional().default('public'),
  function_name: z.string(),
  function_args: z.array(z.string()).optional(),
  activation: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF']),
  events: z.array(z.string()),
  orientation: z.enum(['ROW', 'STATEMENT']).optional(),
  condition: z.string().optional(),
})

// Zod validates `condition` as a runtime string; the SafeSqlFragment brand is a
// separate compile-time trust check. A parsed string is not automatically safe —
// callers must promote untrusted input via acceptUntrustedSql/rawSql before it can
// satisfy this type.
export type PGTriggerCreate = Omit<z.infer<typeof pgTriggerCreateZod>, 'condition'> & {
  condition?: SafeSqlFragment
}

export function create({
  name,
  schema = 'public',
  table,
  function_schema = 'public',
  function_name,
  function_args = [],
  activation,
  events,
  orientation,
  condition,
}: PGTriggerCreate): {
  sql: SafeSqlFragment
  zod: z.ZodType<void>
} {
  const qualifiedTableName = safeSql`${ident(schema)}.${ident(table)}`
  const qualifiedFunctionName = safeSql`${ident(function_schema)}.${ident(function_name)}`
  const triggerEvents = joinSqlFragments(events.map(keyword), ' or ')
  const triggerOrientation = orientation ? safeSql`for each ${keyword(orientation)}` : safeSql``
  const triggerCondition = condition ? safeSql`when (${condition})` : safeSql``
  const functionArgsFragment =
    function_args.length > 0 ? joinSqlFragments(function_args.map(literal), ',') : safeSql``

  const sql = safeSql`create trigger ${ident(name)} ${keyword(activation)} ${triggerEvents} on ${qualifiedTableName} ${triggerOrientation} ${triggerCondition} execute function ${qualifiedFunctionName}(${functionArgsFragment});`

  return {
    sql,
    zod: z.void(),
  }
}

export const pgTriggerUpdateZod = z.object({
  name: z.string().optional(),
  enabled_mode: z.enum(['ORIGIN', 'REPLICA', 'ALWAYS', 'DISABLED']).optional(),
})

export type PGTriggerUpdate = z.infer<typeof pgTriggerUpdateZod>

export function update(
  id: { name: string; schema: string; table: string },
  params: PGTriggerUpdate
): {
  sql: SafeSqlFragment
  zod: z.ZodType<void>
} {
  const qualifiedTableName = safeSql`${ident(id.schema)}.${ident(id.table)}`

  let enabledModeSql = safeSql``

  switch (params.enabled_mode) {
    case 'ORIGIN':
      enabledModeSql = safeSql`alter table ${qualifiedTableName} enable trigger ${ident(id.name)};`
      break
    case 'DISABLED':
      enabledModeSql = safeSql`alter table ${qualifiedTableName} disable trigger ${ident(id.name)};`
      break
    case 'REPLICA':
    case 'ALWAYS':
      enabledModeSql = safeSql`alter table ${qualifiedTableName} enable ${keyword(params.enabled_mode)} trigger ${ident(id.name)};`
      break
    default:
      break
  }

  const updateNameSql =
    params.name && params.name !== id.name
      ? safeSql`alter trigger ${ident(id.name)} on ${qualifiedTableName} rename to ${ident(params.name)};`
      : safeSql``

  // updateNameSql must be last
  const sql = safeSql`begin; ${enabledModeSql}; ${updateNameSql}; commit;`

  return {
    sql,
    zod: z.void(),
  }
}

export function remove(
  id: { name: string; schema: string; table: string },
  { cascade = false } = {}
): {
  sql: SafeSqlFragment
  zod: z.ZodType<void>
} {
  const qualifiedTableName = safeSql`${ident(id.schema)}.${ident(id.table)}`

  const sql = safeSql`drop trigger ${ident(id.name)} on ${qualifiedTableName} ${cascade ? safeSql`cascade` : safeSql``};`

  return {
    sql,
    zod: z.void(),
  }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgTriggerZod,
}
