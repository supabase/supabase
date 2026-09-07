import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { coalesceRowsToArray, filterByList } from './helpers'
import { ident, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { pgColumnArrayZod } from './pg-meta-columns'
import { COLUMNS_SQL } from './sql/columns'
import { MATERIALIZED_VIEWS_SQL } from './sql/materialized-views'

export const pgMaterializedViewZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  is_populated: z.boolean(),
  comment: z.string().nullable(),
  columns: pgColumnArrayZod.optional(),
})

export type PGMaterializedView = z.infer<typeof pgMaterializedViewZod>

export const pgMaterializedViewArrayZod = z.array(pgMaterializedViewZod)
export const pgMaterializedViewOptionalZod = z.optional(pgMaterializedViewZod)

type MaterializedViewWithoutColumns = Omit<PGMaterializedView, 'columns'>
type MaterializedViewWithColumns = PGMaterializedView

type MaterializedViewBasedOnIncludeColumns<T extends boolean | undefined> = T extends true
  ? MaterializedViewWithColumns
  : MaterializedViewWithoutColumns

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
  zod: z.ZodType<MaterializedViewBasedOnIncludeColumns<T>[]>
} {
  let sql = generateEnrichedMaterializedViewsSql({ includeColumns })
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
    zod: pgMaterializedViewArrayZod,
  }
}

type MaterializedViewIdentifier =
  | Pick<PGMaterializedView, 'id'>
  | Pick<PGMaterializedView, 'name' | 'schema'>

function getIdentifierWhereClause(identifier: MaterializedViewIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return safeSql`${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
  }
  throw new Error('Must provide either id or name and schema')
}

export function retrieve(identifier: MaterializedViewIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgMaterializedViewOptionalZod
} {
  let whereClause = getIdentifierWhereClause(identifier)

  const sql = safeSql`${generateEnrichedMaterializedViewsSql({ includeColumns: true })} where ${whereClause};`
  return {
    sql,
    zod: pgMaterializedViewOptionalZod,
  }
}

const generateEnrichedMaterializedViewsSql = ({
  includeColumns,
}: {
  includeColumns?: boolean
}) => safeSql`
with materialized_views as (${MATERIALIZED_VIEWS_SQL})
  ${includeColumns ? safeSql`, columns as (${COLUMNS_SQL})` : safeSql``}
select
  *
  ${includeColumns ? safeSql`, ${coalesceRowsToArray('columns', safeSql`columns.table_id = materialized_views.id`)}` : safeSql``}
from materialized_views`

export default {
  list,
  retrieve,
  zod: pgMaterializedViewZod,
}
