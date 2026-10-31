import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { coalesceRowsToArray, filterByList } from './helpers'
import { ident, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { pgColumnArrayZod } from './pg-meta-columns'
import { COLUMNS_SQL } from './sql/columns'
import { VIEWS_SQL } from './sql/views'

export const pgViewZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  is_updatable: z.boolean(),
  comment: z.string().nullable(),
  columns: pgColumnArrayZod.optional(),
})

export type PGView = z.infer<typeof pgViewZod>

export const pgViewArrayZod = z.array(pgViewZod)
export const pgViewOptionalZod = z.optional(pgViewZod)

type ViewWithoutColumns = Omit<PGView, 'columns'>
type ViewWithColumns = PGView

type ViewBasedOnIncludeColumns<T extends boolean | undefined> = T extends true
  ? ViewWithColumns
  : ViewWithoutColumns

export function list<T extends boolean | undefined = true>(
  {
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
    includeColumns = true as T,
  }: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns?: T
  } = {} as any
): {
  sql: SafeSqlFragment
  zod: z.ZodType<ViewBasedOnIncludeColumns<T>[]>
} {
  let sql = generateEnrichedViewsSql({ includeColumns })
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
    zod: pgViewArrayZod,
  }
}

type ViewIdentifier = Pick<PGView, 'id'> | Pick<PGView, 'name' | 'schema'>

function getIdentifierWhereClause(identifier: ViewIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return safeSql`${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
  }
  throw new Error('Must provide either id or name and schema')
}

export function retrieve(identifier: ViewIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgViewOptionalZod
} {
  let whereClause = getIdentifierWhereClause(identifier)

  const sql = safeSql`${generateEnrichedViewsSql({ includeColumns: true })} where ${whereClause};`
  return {
    sql,
    zod: pgViewOptionalZod,
  }
}

const generateEnrichedViewsSql = ({ includeColumns }: { includeColumns?: boolean }) => safeSql`
with views as (${VIEWS_SQL})
  ${includeColumns ? safeSql`, columns as (${COLUMNS_SQL})` : safeSql``}
select
  *
  ${includeColumns ? safeSql`, ${coalesceRowsToArray('columns', safeSql`columns.table_id = views.id`)}` : safeSql``}
from views`

export default {
  list,
  retrieve,
  zod: pgViewZod,
}
