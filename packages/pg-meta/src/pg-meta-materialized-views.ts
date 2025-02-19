import { literal, ident } from './pg-format'
import { z } from 'zod'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList, coalesceRowsToArray } from './helpers'
import { MATERIALIZED_VIEWS_SQL } from './sql/materialized-views'
import { COLUMNS_SQL } from './sql/columns'

export const pgMaterializedViewZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  is_populated: z.boolean(),
  comment: z.string().nullable(),
  columns: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        table_id: z.number(),
        ordinal_position: z.number(),
        data_type: z.string(),
        format: z.string(),
        is_nullable: z.boolean(),
        is_identity: z.boolean(),
        is_generated: z.boolean(),
        is_updatable: z.boolean(),
        is_unique: z.boolean(),
        enums: z.array(z.string()),
        check: z.string().nullable(),
        default_value: z.string().nullable(),
        schema: z.string(),
        table: z.string(),
        comment: z.string().nullable(),
        identity_generation: z.string().nullable(),
      })
    )
    .optional(),
})

export type PGMaterializedView = z.infer<typeof pgMaterializedViewZod>

export const pgMaterializedViewArrayZod = z.array(pgMaterializedViewZod)
export const pgMaterializedViewOptionalZod = z.optional(pgMaterializedViewZod)

export function list({
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  limit,
  offset,
  includeColumns = true,
}: {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
  includeColumns?: boolean
} = {}): {
  sql: string
  zod: typeof pgMaterializedViewArrayZod
} {
  let sql = generateEnrichedMaterializedViewsSql({ includeColumns })
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
    zod: pgMaterializedViewArrayZod,
  }
}

type MaterializedViewIdentifier =
  | Pick<PGMaterializedView, 'id'>
  | Pick<PGMaterializedView, 'name' | 'schema'>

function getIdentifierWhereClause(identifier: MaterializedViewIdentifier): string {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return `${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
  }
  throw new Error('Must provide either id or name and schema')
}

export function retrieve(identifier: MaterializedViewIdentifier): {
  sql: string
  zod: typeof pgMaterializedViewOptionalZod
} {
  let whereClause = getIdentifierWhereClause(identifier)

  const sql = `${generateEnrichedMaterializedViewsSql({ includeColumns: true })} where ${whereClause};`
  return {
    sql,
    zod: pgMaterializedViewOptionalZod,
  }
}

const generateEnrichedMaterializedViewsSql = ({ includeColumns }: { includeColumns: boolean }) => `
with materialized_views as (${MATERIALIZED_VIEWS_SQL})
  ${includeColumns ? `, columns as (${COLUMNS_SQL})` : ''}
select
  *
  ${includeColumns ? `, ${coalesceRowsToArray('columns', 'columns.table_id = materialized_views.id')}` : ''}
from materialized_views`

export default {
  list,
  retrieve,
  zod: pgMaterializedViewZod,
}
