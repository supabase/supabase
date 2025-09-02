import { z } from 'zod'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { coalesceRowsToArray, filterByList, filterByValue } from './helpers'
import { ident, literal } from './pg-format'
import { pgColumnArrayZod } from './pg-meta-columns'
import { COLUMNS_SQL } from './sql/columns'
import { TABLES_SQL } from './sql/tables'

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
  columns: pgColumnArrayZod.optional(),
})

const pgTableArrayZod = z.array(pgTableZod)

export type PGTable = z.infer<typeof pgTableZod>

type TableWithoutColumns = Omit<PGTable, 'columns'>
type TableWithColumns = PGTable

type TableBasedOnIncludeColumns<T extends boolean | undefined> = T extends true
  ? TableWithColumns
  : TableWithoutColumns

type TableIdentifier = Pick<PGTable, 'id'> | Pick<PGTable, 'name' | 'schema'>

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
  const schemaFilter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  const sql = generateEnrichedTablesSql({
    includeColumns: Boolean(includeColumns),
    schemaFilter,
    limit,
    offset,
  })
  return {
    sql,
    zod: pgTableArrayZod,
  }
}

function retrieve(identifier: TableIdentifier): {
  sql: string
  zod: z.ZodType<TableWithColumns>
} {
  if ('id' in identifier && identifier.id) {
    const idsFilter = filterByValue([identifier.id])
    const sql = generateEnrichedTablesSql({ includeColumns: true, idsFilter })
    return { sql, zod: pgTableZod }
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    const tableIdentifierFilter = filterByValue([`${identifier.schema}.${identifier.name}`])
    const schemaFilter = filterByList([identifier.schema], [])
    const sql = generateEnrichedTablesSql({
      includeColumns: true,
      schemaFilter,
      tableIdentifierFilter,
    })
    return { sql, zod: pgTableZod }
  }
  throw new Error('Must provide either id or name and schema')
}

function remove(
  table: Pick<PGTable, 'name' | 'schema'>,
  { cascade = false } = {}
): { sql: string } {
  const sql = `DROP TABLE ${ident(table.schema)}.${ident(table.name)} ${
    cascade ? 'CASCADE' : 'RESTRICT'
  };`
  return { sql }
}

type TableCreateParams = {
  name: string
  schema?: string
  comment?: string
}

function create({ name, schema = 'public', comment }: TableCreateParams): {
  sql: string
} {
  const tableSql = `CREATE TABLE ${ident(schema)}.${ident(name)} ();`
  const commentSql =
    comment === undefined
      ? ''
      : `COMMENT ON TABLE ${ident(schema)}.${ident(name)} IS ${literal(comment)};`
  const sql = `BEGIN; ${tableSql} ${commentSql} COMMIT;`
  return { sql }
}

type TableUpdateParams = {
  name?: string
  schema?: string
  rls_enabled?: boolean
  rls_forced?: boolean
  replica_identity?: 'DEFAULT' | 'INDEX' | 'FULL' | 'NOTHING'
  replica_identity_index?: string
  primary_keys?: Array<{ name: string }>
  comment?: string
}

function update(
  old: Pick<PGTable, 'id' | 'name' | 'schema'>,
  {
    name,
    schema,
    rls_enabled,
    rls_forced,
    replica_identity,
    replica_identity_index,
    primary_keys,
    comment,
  }: TableUpdateParams
): { sql: string } {
  const alter = `ALTER TABLE ${ident(old.schema)}.${ident(old.name)}`
  const schemaSql = schema === undefined ? '' : `${alter} SET SCHEMA ${ident(schema)};`
  let nameSql = ''
  if (name !== undefined && name !== old.name) {
    const currentSchema = schema === undefined ? old.schema : schema
    nameSql = `ALTER TABLE ${ident(currentSchema)}.${ident(old.name)} RENAME TO ${ident(name)};`
  }
  let enableRls = ''
  if (rls_enabled !== undefined) {
    const enable = `${alter} ENABLE ROW LEVEL SECURITY;`
    const disable = `${alter} DISABLE ROW LEVEL SECURITY;`
    enableRls = rls_enabled ? enable : disable
  }
  let forceRls = ''
  if (rls_forced !== undefined) {
    const enable = `${alter} FORCE ROW LEVEL SECURITY;`
    const disable = `${alter} NO FORCE ROW LEVEL SECURITY;`
    forceRls = rls_forced ? enable : disable
  }
  let replicaSql = ''
  if (replica_identity === undefined) {
    // skip
  } else if (replica_identity === 'INDEX') {
    replicaSql = `${alter} REPLICA IDENTITY USING INDEX ${replica_identity_index};`
  } else {
    replicaSql = `${alter} REPLICA IDENTITY ${replica_identity};`
  }
  let primaryKeysSql = ''
  if (primary_keys === undefined) {
    // skip
  } else {
    primaryKeysSql += `
DO $$
DECLARE
  r record;
BEGIN
  SELECT conname
    INTO r
    FROM pg_constraint
    WHERE contype = 'p' AND conrelid = ${literal(old.id)};
  IF r IS NOT NULL THEN
    EXECUTE ${literal(`${alter} DROP CONSTRAINT `)} || quote_ident(r.conname);
  END IF;
END
$$;
`

    if (primary_keys.length === 0) {
      // skip
    } else {
      primaryKeysSql += `${alter} ADD PRIMARY KEY (${primary_keys
        .map((x) => ident(x.name))
        .join(',')});`
    }
  }
  const commentSql =
    comment === undefined
      ? ''
      : `COMMENT ON TABLE ${ident(old.schema)}.${ident(old.name)} IS ${literal(comment)};`
  // nameSql must be last, right below schemaSql
  const sql = `
BEGIN;
  ${enableRls}
  ${forceRls}
  ${replicaSql}
  ${primaryKeysSql}
  ${commentSql}
  ${schemaSql}
  ${nameSql}
COMMIT;`

  return { sql }
}

const generateEnrichedTablesSql = ({
  includeColumns,
  schemaFilter,
  tableIdentifierFilter,
  idsFilter,
  limit,
  offset,
}: {
  includeColumns: boolean
  schemaFilter?: string
  tableIdentifierFilter?: string
  idsFilter?: string
  limit?: number
  offset?: number
}) => `
with tables as (${TABLES_SQL({ schemaFilter, tableIdentifierFilter, idsFilter, limit, offset })})
  ${includeColumns ? `, columns as (${COLUMNS_SQL({ schemaFilter, tableIdFilter: idsFilter, tableIdentifierFilter: tableIdentifierFilter })})` : ''}
select
  *
  ${includeColumns ? `, ${coalesceRowsToArray('columns', 'columns.table_id = tables.id')}` : ''}
from tables`

export { list, retrieve, remove, create, update }
