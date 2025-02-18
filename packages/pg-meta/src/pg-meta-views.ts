import { literal, ident } from './pg-format'
import { z } from 'zod'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList, coalesceRowsToArray } from './helpers'
import { VIEWS_SQL } from './sql/views'
import { COLUMNS_SQL } from './sql/columns'

export const pgViewZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  is_updatable: z.boolean(),
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

export type PGView = z.infer<typeof pgViewZod>

export const pgViewArrayZod = z.array(pgViewZod)
export const pgViewOptionalZod = z.optional(pgViewZod)

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
  zod: typeof pgViewArrayZod
} {
  let sql = generateEnrichedViewsSql({ includeColumns })
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
    zod: pgViewArrayZod,
  }
}

type ViewIdentifier = Pick<PGView, 'id'> | Pick<PGView, 'name' | 'schema'>

function getIdentifierWhereClause(identifier: ViewIdentifier): string {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return `${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
  }
  throw new Error('Must provide either id or name and schema')
}

export function retrieve(identifier: ViewIdentifier): {
  sql: string
  zod: typeof pgViewOptionalZod
} {
  let whereClause = getIdentifierWhereClause(identifier)

  const sql = `${generateEnrichedViewsSql({ includeColumns: true })} where ${whereClause};`
  return {
    sql,
    zod: pgViewOptionalZod,
  }
}

const generateEnrichedViewsSql = ({ includeColumns }: { includeColumns: boolean }) => `
with views as (${VIEWS_SQL})
  ${includeColumns ? `, columns as (${COLUMNS_SQL})` : ''}
select
  *
  ${includeColumns ? `, ${coalesceRowsToArray('columns', 'columns.table_id = views.id')}` : ''}
from views`

export default {
  list,
  retrieve,
  zod: pgViewZod,
}
