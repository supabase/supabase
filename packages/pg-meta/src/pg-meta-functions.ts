import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { ident, joinSqlFragments, keyword, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { FUNCTIONS_SQL } from './sql/functions'

export const pgFunctionZod = z.object({
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

export type PGFunction = z.infer<typeof pgFunctionZod>

export const pgFunctionArrayZod = z.array(pgFunctionZod)
export const pgFunctionOptionalZod = z.optional(pgFunctionZod)

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
  zod: typeof pgFunctionArrayZod
} {
  let sql = safeSql`
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
    zod: pgFunctionArrayZod,
  }
}

type FunctionsRetrieveReturn = {
  sql: SafeSqlFragment
  zod: typeof pgFunctionOptionalZod
}

export function retrieve({ id }: { id: number }): FunctionsRetrieveReturn
export function retrieve({
  name,
  schema,
  args,
}: {
  name: string
  schema: string
  args: string[]
}): FunctionsRetrieveReturn
export function retrieve({
  id,
  name,
  schema = 'public',
  args = [],
}: {
  id?: number
  name?: string
  schema?: string
  args?: string[]
}): FunctionsRetrieveReturn {
  if (id) {
    const sql = safeSql`
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
    const argsFragment = args.length
      ? safeSql`(
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
                  array[${joinSqlFragments(args.map(literal), ',')}]
                ),
                ' '
              ) as arr
            ) as split_args
          ) args
        )`
      : literal('')
    const sql = safeSql`with f as (
      ${FUNCTIONS_SQL}
    )
    select
      f.*
    from f join pg_proc as p on id = p.oid where schema = ${literal(schema)} and name = ${literal(name)} and p.proargtypes::text = ${argsFragment}`

    return {
      sql,
      zod: pgFunctionOptionalZod,
    }
  } else {
    throw new Error('Must provide either id or name and schema')
  }
}

export const pgFunctionCreateZod = z.object({
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

export type PGFunctionCreate = z.infer<typeof pgFunctionCreateZod>

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
): SafeSqlFragment {
  const params = config_params
    ? safeSql`${joinSqlFragments(
        Object.entries(config_params).map(([param, value]) =>
          safeSql`SET ${ident(param)} ${
            value === 'FROM CURRENT'
              ? safeSql`FROM CURRENT`
              : safeSql`TO ${value === '""' ? literal("''") : literal(value)}`
          }`
        ),
        '\n'
      )}`
    : safeSql``

  return safeSql`
    CREATE ${replace ? safeSql`OR REPLACE` : safeSql``} FUNCTION ${ident(schema!)}.${ident(name!)}(${
      args?.join(', ') || ''
    })
    RETURNS ${keyword(return_type ?? 'void')}
    AS ${literal(definition)}
    LANGUAGE ${keyword(language ?? 'sql')}
    ${keyword(behavior ?? 'VOLATILE')}
    CALLED ON NULL INPUT
    ${security_definer ? safeSql`SECURITY DEFINER` : safeSql`SECURITY INVOKER`}
    ${params};
  `
}

export function create({
  name,
  schema = 'public',
  args = [],
  definition,
  return_type = 'void',
  language = 'sql',
  behavior = 'VOLATILE',
  security_definer = false,
  config_params = {},
}: PGFunctionCreate): { sql: SafeSqlFragment; zod: typeof z.void } {
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
    zod: z.void(),
  }
}

export const pgFunctionUpdateZod = z.object({
  name: z.string().optional(),
  schema: z.string().optional(),
  definition: z.string().optional(),
})

export type PGFunctionUpdate = z.infer<typeof pgFunctionUpdateZod>

export function update(currentFunc: PGFunction, { name, schema, definition }: PGFunctionUpdate) {
  const identityArgs = currentFunc.identity_argument_types

  const updateDefinitionSql: SafeSqlFragment =
    typeof definition === 'string'
      ? _generateCreateFunctionSql(
          {
            ...currentFunc,
            definition,
            args: currentFunc.argument_types.split(', '),
            config_params: currentFunc.config_params ?? {},
          },
          { replace: true }
        )
      : safeSql``

  const updateNameSql: SafeSqlFragment =
    name && name !== currentFunc.name
      ? safeSql`ALTER FUNCTION ${ident(currentFunc.schema)}.${ident(
          currentFunc.name
        )}(${identityArgs}) RENAME TO ${ident(name)};`
      : safeSql``

  const updateSchemaSql: SafeSqlFragment =
    schema && schema !== currentFunc.schema
      ? safeSql`ALTER FUNCTION ${ident(currentFunc.schema)}.${ident(
          name || currentFunc.name
        )}(${identityArgs}) SET SCHEMA ${ident(schema)};`
      : safeSql``

  const sql = safeSql`
    DO LANGUAGE plpgsql $$
    BEGIN
      IF ${typeof definition === 'string' ? safeSql`TRUE` : safeSql`FALSE`} THEN
        ${updateDefinitionSql}

        IF (
          SELECT id
          FROM (${FUNCTIONS_SQL}) AS f
          WHERE f.schema = ${literal(currentFunc.schema)}
          AND f.name = ${literal(currentFunc.name)}
          AND f.identity_argument_types = ${literal(identityArgs)}
        ) != ${literal(currentFunc.id)} THEN
          RAISE EXCEPTION 'Cannot find function "%s"."%s"(%s)',
            ${literal(currentFunc.schema)},
            ${literal(currentFunc.name)},
            ${literal(identityArgs)};
        END IF;
      END IF;

      ${updateNameSql}

      ${updateSchemaSql}
    END;
    $$
  `

  return {
    sql,
    zod: z.void(),
  }
}

export const pgFunctionDeleteZod = z.object({
  cascade: z.boolean().default(false).optional(),
})

export type PGFunctionDelete = z.infer<typeof pgFunctionDeleteZod>

export function remove(func: PGFunction, { cascade = false }: PGFunctionDelete = {}) {
  const sql = safeSql`DROP FUNCTION ${ident(func.schema)}.${ident(func.name)}
  (${func.identity_argument_types})
  ${cascade ? safeSql`CASCADE` : safeSql`RESTRICT`}`

  return {
    sql,
    zod: z.void(),
  }
}
