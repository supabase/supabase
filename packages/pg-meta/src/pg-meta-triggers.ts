import { ident, literal } from './pg-format'
import { z } from 'zod'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { TRIGGERS_SQL } from './sql/triggers'

type TriggerIdentifier = Pick<PGTrigger, 'id'> | Pick<PGTrigger, 'name' | 'schema' | 'table'>

function getIdentifierWhereClause(identifier: TriggerIdentifier): string {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.table && identifier.schema) {
    return `${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)} and ${ident('table')} = ${literal(identifier.table)}`
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
  orientation: z.string(),
  activation: z.string(),
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
  sql: string
  zod: typeof pgTriggerArrayZod
} {
  let sql = `with triggers as (${TRIGGERS_SQL}) select * from triggers`
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
    zod: pgTriggerArrayZod,
  }
}

type TriggersRetrieveReturn = {
  sql: string
  zod: typeof pgTriggerOptionalZod
}

export function retrieve(identifier: TriggerIdentifier): TriggersRetrieveReturn
export function retrieve(params: TriggerIdentifier): TriggersRetrieveReturn {
  const whereIdentifierCondition = getIdentifierWhereClause(params)
  const sql = `with triggers as (${TRIGGERS_SQL}) select * from triggers where ${whereIdentifierCondition};`
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

export type PGTriggerCreate = z.infer<typeof pgTriggerCreateZod>

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
  sql: string
  zod: z.ZodType<void>
} {
  const qualifiedTableName = `${ident(schema)}.${ident(table)}`
  const qualifiedFunctionName = `${ident(function_schema)}.${ident(function_name)}`
  const triggerEvents = events.join(' OR ')
  const triggerOrientation = orientation ? `FOR EACH ${orientation}` : ''
  const triggerCondition = condition ? `WHEN (${condition})` : ''
  const functionArgsStr = function_args.map(literal).join(',')

  const sql = `CREATE TRIGGER ${ident(
    name
  )} ${activation} ${triggerEvents} ON ${qualifiedTableName} ${triggerOrientation} ${triggerCondition} EXECUTE FUNCTION ${qualifiedFunctionName}(${functionArgsStr});`

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
  identifier: TriggerIdentifier,
  params: PGTriggerUpdate
): {
  sql: string
} {
  const whereIdentifierCondition = getIdentifierWhereClause(identifier)

  const sql = `
do $$
declare
  old record;
begin
  with triggers as (${TRIGGERS_SQL})
  select * into old from triggers where ${whereIdentifierCondition};
  
  if old is null then
    raise exception 'Cannot find trigger: %', ${literal(whereIdentifierCondition)};
  end if;

  ${
    params.enabled_mode
      ? `
  execute(format('alter table %I.%I ${
    params.enabled_mode === 'DISABLED'
      ? 'DISABLE'
      : 'ENABLE' +
        (params.enabled_mode === 'ALWAYS' || params.enabled_mode === 'REPLICA'
          ? ' ' + params.enabled_mode
          : '')
  } TRIGGER %I', 
    old.schema, old.table, old.name));`
      : ''
  }

  ${
    params.name
      ? `
    -- Using the same name in the rename clause gives an error, so only do it if the new name is different.
  if ${literal(params.name)} != old.name then
    execute(format('alter trigger %I on %I.%I rename to %I;', old.name, old.schema, old.table, ${literal(params.name)}));
  end if;`
      : ''
  }
end
$$;`

  return {
    sql,
  }
}

export function remove(
  identifier: TriggerIdentifier,
  { cascade = false } = {}
): {
  sql: string
  zod: z.ZodType<void>
} {
  const whereIdentifierCondition = getIdentifierWhereClause(identifier)

  const sql = `
do $$
declare
  old record;
begin
  with triggers as (${TRIGGERS_SQL})
  select * into old from triggers where ${whereIdentifierCondition};
  
  if old is null then
    raise exception 'Cannot find trigger';
  end if;

  execute(format('DROP TRIGGER %I ON %I.%I ${cascade ? 'CASCADE' : ''}',
    old.name, old.schema, old.table));
end
$$;`

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
