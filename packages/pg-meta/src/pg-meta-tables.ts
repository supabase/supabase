import { z } from 'zod'
import { coalesceRowsToArray, filterByList } from './helpers'
import { TABLES_SQL } from './sql/tables'
import { COLUMNS_SQL } from './sql/columns'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { ident, literal } from './pg-format'

const pgTableColumnZod = z.object({
  id: z.string().regex(/^(\d+)\.(\d+)$/),
  table_id: z.number().optional(),
  name: z.string(),
  schema: z.string(),
  table: z.string(),
  is_identity: z.boolean(),
  is_generated: z.boolean(),
  is_nullable: z.boolean(),
  is_unique: z.boolean(),
  is_updatable: z.boolean(),
  identity_generation: z.string().nullable(),
  default_value: z.string().nullable(),
  data_type: z.string(),
  format: z.string(),
  enums: z.array(z.string()),
  check: z.string().nullable(),
  comment: z.string().nullable(),
  ordinal_position: z.number(),
})

const pgTablePrimaryKeyZod = z.object({
  table_id: z.number(),
  name: z.string(),
  schema: z.string(),
  table_name: z.string(),
})

const pgTableRelationshipZod = z.object({
  id: z.number(),
  constraint_name: z.string(),
  source_schema: z.string(),
  source_table_name: z.string(),
  source_column_name: z.string(),
  target_table_schema: z.string(),
  target_table_name: z.string(),
  target_column_name: z.string(),
})

const pgTableZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  rls_enabled: z.boolean(),
  rls_forced: z.boolean(),
  replica_identity: z.enum(['DEFAULT', 'INDEX', 'FULL', 'NOTHING']),
  bytes: z.number(),
  size: z.string(),
  live_rows_estimate: z.number(),
  dead_rows_estimate: z.number(),
  comment: z.string().nullable(),
  primary_keys: z.array(pgTablePrimaryKeyZod),
  relationships: z.array(pgTableRelationshipZod),
  columns: z.array(pgTableColumnZod).optional(),
})

const pgTableArrayZod = z.array(pgTableZod)

export type PGTable = z.infer<typeof pgTableZod>

type TableWithoutColumns = Omit<PGTable, 'columns'>
type TableWithColumns = PGTable

type TableBasedOnIncludeColumns<T extends boolean | undefined> = T extends true
  ? TableWithColumns
  : TableWithoutColumns

type TableIdentifier = Pick<PGTable, 'id'> | Pick<PGTable, 'name' | 'schema'>

function getIdentifierWhereClause(identifier: TableIdentifier): string {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return `${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
  }
  throw new Error('Must provide either id or name and schema')
}

function list<T extends boolean | undefined = true>(
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
  sql: string
  zod: z.ZodType<TableBasedOnIncludeColumns<T>[]>
} {
  let sql = generateEnrichedTablesSql({ includeColumns })
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
    zod: pgTableArrayZod,
  }
}

function retrieve(identifier: TableIdentifier): {
  sql: string
  zod: z.ZodType<PGTable | undefined>
} {
  let whereClause = getIdentifierWhereClause(identifier)

  const sql = `${generateEnrichedTablesSql({ includeColumns: true })} where ${whereClause};`
  return {
    sql,
    zod: pgTableZod.optional(),
  }
}

const generateEnrichedTablesSql = ({ includeColumns }: { includeColumns?: boolean }) => `
  with tables as (${TABLES_SQL})
  ${includeColumns ? `, columns as (${COLUMNS_SQL})` : ''}
  select
    *
    ${includeColumns ? `, ${coalesceRowsToArray('columns', 'columns.table_id = tables.id')}` : ''}
  from tables`

export default {
  list,
  retrieve,
  zod: pgTableZod,
}

export { list }
