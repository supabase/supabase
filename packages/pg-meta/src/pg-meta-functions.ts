import { ident, literal } from 'pg-format'
import { FUNCTIONS_SQL } from './sql/functions'
import { z } from 'zod'
import { filterByList } from './helpers'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'

const pgFunctionZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  language: z.string(),
  definition: z.string(),
  complete_statement: z.string(),
  args: z.array(
    z.object({
      mode: z.union([
        z.literal('in'),
        z.literal('out'),
        z.literal('inout'),
        z.literal('variadic'),
        z.literal('table'),
      ]),
      name: z.string(),
      type_id: z.number(),
      has_default: z.boolean(),
    })
  ),
  argument_types: z.string(),
  identity_argument_types: z.string(),
  return_type_id: z.number(),
  return_type: z.string(),
  return_type_relation_id: z.union([z.number(), z.null()]),
  is_set_returning_function: z.boolean(),
  behavior: z.union([z.literal('IMMUTABLE'), z.literal('STABLE'), z.literal('VOLATILE')]),
  security_definer: z.boolean(),
  config_params: z.union([z.record(z.string(), z.string()), z.null()]),
})

const pgFunctionArrayZod = z.array(pgFunctionZod)
const pgFunctionOptionalZod = z.optional(pgFunctionZod)

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
  zod: typeof pgFunctionArrayZod
} {
  let sql = /* SQL */ `
    with f as (
      ${FUNCTIONS_SQL}
    )
    select
      f.*
    from f
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
    sql = `${sql} limit ${limit}`
  }
  if (offset) {
    sql = `${sql} offset ${offset}`
  }

  return {
    sql,
    zod: pgFunctionArrayZod,
  }
}

function retrieve({ id }: { id: number }): {
  sql: string
  zod: typeof pgFunctionOptionalZod
}
function retrieve({ name, schema, args }: { name: string; schema: string; args: string[] }): {
  sql: string
  zod: typeof pgFunctionOptionalZod
}
function retrieve({
  id,
  name,
  schema = 'public',
  args = [],
}: {
  id?: number
  name?: string
  schema?: string
  args?: string[]
}): {
  sql: string
  zod: typeof pgFunctionOptionalZod
} {
  if (id) {
    const sql = /* SQL */ `
      with f as (
        ${FUNCTIONS_SQL}
      )
      select
        f.*
      from f where id = ${literal(id)};`

    return {
      sql,
      zod: pgFunctionOptionalZod,
    }
  } else if (name && schema && args) {
    const sql = /* SQL */ `with f as (
      ${FUNCTIONS_SQL}
    )
    select
      f.*
    from f join pg_proc as p on id = p.oid where schema = ${literal(
      schema
    )} and name = ${literal(name)} and p.proargtypes::text = ${
      args.length
        ? /* SQL */ `(
          select string_agg(type_oid::text, ' ') from (
            select (
              split_args.arr[
                array_length(
                  split_args.arr,
                  1
                )
              ]::regtype::oid
            ) as type_oid from (
              select string_to_array(
                unnest(
                  array[${args.map(literal)}]
                ),
                ' '
              ) as arr
            ) as split_args
          ) args
        )`
        : literal('')
    }`

    return {
      sql,
      zod: pgFunctionOptionalZod,
    }
  } else {
    throw new Error('Must provide either id or name and schema')
  }
}

const pgFunctionCreateZod = z.object({
  name: z.string(),
  definition: z.string(),
  args: z.array(z.string()).optional(),
  behavior: z.enum(['IMMUTABLE', 'STABLE', 'VOLATILE']).optional(),
  config_params: z.record(z.string(), z.string()).optional(),
  schema: z.string().optional(),
  language: z.string().optional(),
  return_type: z.string().optional(),
  security_definer: z.boolean().optional(),
})

type PGFunctionCreate = z.infer<typeof pgFunctionCreateZod>

function _generateCreateFunctionSql(
  {
    name,
    schema,
    args,
    definition,
    return_type,
    language,
    behavior,
    security_definer,
    config_params,
  }: PGFunctionCreate,
  { replace = false } = {}
): string {
  return `
    CREATE ${replace ? 'OR REPLACE' : ''} FUNCTION ${ident(schema!)}.${ident(name!)}(${
      args?.join(', ') || ''
    })
    RETURNS ${return_type}
    AS ${literal(definition)}
    LANGUAGE ${language}
    ${behavior}
    CALLED ON NULL INPUT
    ${security_definer ? 'SECURITY DEFINER' : 'SECURITY INVOKER'}
    ${
      config_params
        ? Object.entries(config_params)
            .map(
              ([param, value]: string[]) =>
                `SET ${param} ${value[0] === 'FROM CURRENT' ? 'FROM CURRENT' : 'TO ' + value}`
            )
            .join('\n')
        : ''
    };
  `
}

function create({
  name,
  schema = 'public',
  args = [],
  definition,
  return_type = 'void',
  language = 'sql',
  behavior = 'VOLATILE',
  security_definer = false,
  config_params = {},
}: PGFunctionCreate) {
  const sql = _generateCreateFunctionSql({
    name,
    schema,
    args,
    definition,
    return_type,
    language,
    behavior,
    security_definer,
    config_params,
  })

  return {
    sql,
    zod: pgFunctionZod,
  }
}

export default { list, retrieve, create, pgFunctionZod, pgFunctionCreateZod }
