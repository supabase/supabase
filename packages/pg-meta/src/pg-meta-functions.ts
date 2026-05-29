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

// Zod validates `args`, `return_type`, and `config_params` values as runtime
// strings; the SafeSqlFragment brand is a separate compile-time trust check.
// `args` items are `"name type"` fragments, `return_type` is a type
// expression (e.g. "integer", "SETOF users"), and each `config_params` value
// is interpolated raw after `SET <param> TO` — all three drop into the
// CREATE FUNCTION statement uninspected, so callers must promote untrusted
// input via acceptUntrustedSql (and ensure the promotion satisfies safety
// requirements) before calling create(). `'FROM CURRENT'` is a sentinel for
// the `SET <param> FROM CURRENT` grammar and is detected by string equality.
export type PGFunctionCreate = Omit<
  z.infer<typeof pgFunctionCreateZod>,
  'args' | 'return_type' | 'config_params'
> & {
  args?: Array<SafeSqlFragment>
  return_type?: SafeSqlFragment
  config_params?: Record<string, SafeSqlFragment | 'FROM CURRENT'>
}

// `update()` and `remove()` reuse signature pieces from a previously-fetched
// function. Callers must pass a value whose raw-SQL fields (`argument_types`,
// `identity_argument_types`, `return_type`, and `config_params` values)
// have been branded at the API/database boundary.
export type PGSavedFunction = Omit<
  PGFunction,
  'argument_types' | 'identity_argument_types' | 'return_type' | 'config_params'
> & {
  argument_types: SafeSqlFragment
  identity_argument_types: SafeSqlFragment
  return_type: SafeSqlFragment
  config_params: Record<string, SafeSqlFragment> | null
}

// PostgreSQL configuration parameters can be namespaced custom GUCs
// (e.g. `app.jwt_secret`, `pgaudit.log`). Neither `keyword` nor `ident`
// fits: `keyword`'s regex rejects `.`, and `ident` would quote the whole
// value as a single identifier (`"app.jwt_secret"`), which Postgres reads
// as one literal name rather than a qualified reference. Split on `.`,
// `ident` each segment, and rejoin with a literal `.`.
function qualifiedIdent(value: string): SafeSqlFragment {
  return value
    .split('.')
    .map(ident)
    .reduce<SafeSqlFragment>(
      (acc, part, i) => (i === 0 ? part : safeSql`${acc}.${part}`),
      safeSql``
    )
}

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
  const argsFragment = args && args.length > 0 ? joinSqlFragments(args, ', ') : safeSql``
  const configParamsFragment =
    config_params && Object.keys(config_params).length > 0
      ? joinSqlFragments(
          Object.entries(config_params).map(([param, value]) =>
            value === 'FROM CURRENT'
              ? safeSql`SET ${qualifiedIdent(param)} FROM CURRENT`
              : safeSql`SET ${qualifiedIdent(param)} TO ${value}`
          ),
          '\n'
        )
      : safeSql``

  return safeSql`
    CREATE ${replace ? safeSql`OR REPLACE` : safeSql``} FUNCTION ${ident(schema!)}.${ident(name!)}(${argsFragment})
    RETURNS ${return_type!}
    AS ${literal(definition)}
    LANGUAGE ${keyword(language!)}
    ${keyword(behavior!)}
    CALLED ON NULL INPUT
    ${security_definer ? safeSql`SECURITY DEFINER` : safeSql`SECURITY INVOKER`}
    ${configParamsFragment};
  `
}

export function create({
  name,
  schema = 'public',
  args = [],
  definition,
  return_type = safeSql`void`,
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
    zod: z.void(),
  }
}

export const pgFunctionUpdateZod = z.object({
  name: z.string().optional(),
  schema: z.string().optional(),
  definition: z.string().optional(),
})

export type PGFunctionUpdate = z.infer<typeof pgFunctionUpdateZod>

function splitArgumentTypes(argumentTypes: SafeSqlFragment): Array<SafeSqlFragment> {
  return argumentTypes.split(', ') as Array<SafeSqlFragment>
}

export function update(
  currentFunc: PGSavedFunction,
  { name, schema, definition }: PGFunctionUpdate
): { sql: SafeSqlFragment; zod: z.ZodType<void> } {
  const args = splitArgumentTypes(currentFunc.argument_types)
  const identityArgs = currentFunc.identity_argument_types

  const updateDefinitionSql =
    typeof definition === 'string'
      ? _generateCreateFunctionSql(
          {
            ...currentFunc,
            definition,
            args,
            config_params: currentFunc.config_params ?? {},
          },
          { replace: true }
        )
      : safeSql``

  const updateNameSql =
    name && name !== currentFunc.name
      ? safeSql`ALTER FUNCTION ${ident(currentFunc.schema)}.${ident(currentFunc.name)}(${identityArgs}) RENAME TO ${ident(name)};`
      : safeSql``

  const updateSchemaSql =
    schema && schema !== currentFunc.schema
      ? safeSql`ALTER FUNCTION ${ident(currentFunc.schema)}.${ident(name || currentFunc.name)}(${identityArgs}) SET SCHEMA ${ident(schema)};`
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
          RAISE EXCEPTION ${literal(`Cannot find function "${currentFunc.schema}"."${currentFunc.name}"(${identityArgs})`)};
        END IF;
      END IF;

      ${updateNameSql}

      ${updateSchemaSql}
    END;
    $$;
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

export function remove(
  func: PGSavedFunction,
  { cascade = false }: PGFunctionDelete = {}
): { sql: SafeSqlFragment; zod: z.ZodType<void> } {
  const sql = safeSql`DROP FUNCTION ${ident(func.schema)}.${ident(func.name)}(${func.identity_argument_types}) ${cascade ? safeSql`CASCADE` : safeSql`RESTRICT`};`

  return {
    sql,
    zod: z.void(),
  }
}
