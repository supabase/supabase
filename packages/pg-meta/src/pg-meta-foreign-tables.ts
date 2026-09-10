import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { coalesceRowsToArray, filterByList } from './helpers'
import { ident, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { pgColumnArrayZod } from './pg-meta-columns'
import { COLUMNS_SQL } from './sql/columns'
import { FOREIGN_TABLES_SQL } from './sql/foreign-tables'

export const pgForeignTableZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  comment: z.string().nullable(),
  foreign_server_name: z.string(),
  foreign_data_wrapper_name: z.string(),
  foreign_data_wrapper_handler: z.string(),
  columns: pgColumnArrayZod.optional(),
})

export type PGForeignTable = z.infer<typeof pgForeignTableZod>

export const pgForeignTableArrayZod = z.array(pgForeignTableZod)
export const pgForeignTableOptionalZod = z.optional(pgForeignTableZod)

type ForeignTableWithoutColumns = Omit<PGForeignTable, 'columns'>
type ForeignTableWithColumns = PGForeignTable

type ForeignTableBasedOnIncludeColumns<T extends boolean | undefined> = T extends true
  ? ForeignTableWithColumns
  : ForeignTableWithoutColumns

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
  zod: z.ZodType<ForeignTableBasedOnIncludeColumns<T>[]>
} {
  let sql = generateEnrichedForeignTablesSql({ includeColumns })
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
    zod: pgForeignTableArrayZod,
  }
}

type ForeignTableIdentifier = Pick<PGForeignTable, 'id'> | Pick<PGForeignTable, 'name' | 'schema'>

function getIdentifierWhereClause(identifier: ForeignTableIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return safeSql`${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
  }
  throw new Error('Must provide either id or name and schema')
}

export function retrieve(identifier: ForeignTableIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgForeignTableOptionalZod
} {
  const sql = safeSql`${generateEnrichedForeignTablesSql({ includeColumns: true })} where ${getIdentifierWhereClause(identifier)};`
  return {
    sql,
    zod: pgForeignTableOptionalZod,
  }
}

const generateEnrichedForeignTablesSql = ({
  includeColumns,
}: {
  includeColumns?: boolean
}) => safeSql`
with foreign_tables as (${FOREIGN_TABLES_SQL})
  ${includeColumns ? safeSql`, columns as (${COLUMNS_SQL})` : safeSql``}
select
  *
  ${includeColumns ? safeSql`, ${coalesceRowsToArray('columns', safeSql`columns.table_id = foreign_tables.id`)}` : safeSql``}
from foreign_tables`

export default {
  list,
  retrieve,
  zod: pgForeignTableZod,
}
