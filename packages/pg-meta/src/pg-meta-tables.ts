import { z } from 'zod'
import { coalesceRowsToArray, exceptionIdentifierNotFound, filterByList } from './helpers'
import { TABLES_SQL } from './sql/tables'
import { COLUMNS_SQL } from './sql/columns'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { ident, literal } from './pg-format'
import { pgColumnArrayZod } from './pg-meta-columns'

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

type TableRemoveParams = { cascade: boolean }
function remove(
  identifier: TableIdentifier,
  params: TableRemoveParams = { cascade: false }
): { sql: string } {
  const whereClause = getIdentifierWhereClause(identifier)
  const sql = `
    do $$
    declare
        old record;
    begin
        with tables as (${generateEnrichedTablesSql({ includeColumns: false })})
        select * into old from tables where ${whereClause};
        if old is null then
           ${exceptionIdentifierNotFound('table', whereClause)}
        end if;
        execute format('drop table %I.%I ${params.cascade ? 'cascade' : 'restrict'}', old.schema, old.name);
    end
    $$;
    `
  return { sql }
}

const generateEnrichedTablesSql = ({ includeColumns }: { includeColumns?: boolean }) => `
  with tables as (${TABLES_SQL})
  ${includeColumns ? `, columns as (${COLUMNS_SQL})` : ''}
  select
    *
    ${includeColumns ? `, ${coalesceRowsToArray('columns', 'columns.table_id = tables.id')}` : ''}
  from tables`

type TableCreateParams = {
  name: string
  schema?: string
  comment?: string
}

function create({ name, schema = 'public', comment }: TableCreateParams): { sql: string } {
  const sql = `
do $$
begin
  execute format('create table %I.%I ()', ${literal(schema)}, ${literal(name)});
  ${
    comment === undefined
      ? ''
      : `
  execute format('comment on table %I.%I is %L', ${literal(schema)}, ${literal(name)}, ${literal(comment)});`
  }
end
$$;`

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
  identifier: TableIdentifier,
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
  const sql = `
DO $$
DECLARE
  v_table record;
  r record;
BEGIN
  WITH tables AS (
    ${generateEnrichedTablesSql({ includeColumns: false })}
  )
  SELECT *
  INTO v_table
  FROM tables
  WHERE ${getIdentifierWhereClause(identifier)};

  IF v_table IS NULL THEN
    ${exceptionIdentifierNotFound('table', getIdentifierWhereClause(identifier))}
  END IF;

  ${
    rls_enabled !== undefined
      ? `execute format('ALTER TABLE %I.%I %s ROW LEVEL SECURITY',
          v_table.schema, v_table.name,
          CASE WHEN ${literal(rls_enabled)} THEN 'ENABLE' ELSE 'DISABLE' END);`
      : ''
  }

  ${
    rls_forced !== undefined
      ? `execute format('ALTER TABLE %I.%I %s FORCE ROW LEVEL SECURITY',
          v_table.schema, v_table.name,
          CASE WHEN ${literal(rls_forced)} THEN '' ELSE 'NO' END);`
      : ''
  }

  ${
    replica_identity !== undefined
      ? `execute format('ALTER TABLE %I.%I REPLICA IDENTITY %s%s',
          v_table.schema, v_table.name,
          ${literal(replica_identity)},
          CASE WHEN ${literal(replica_identity)} = 'INDEX' 
            THEN format(' USING INDEX %I', ${literal(replica_identity_index!)})
            ELSE '' END);`
      : ''
  }

  ${
    primary_keys !== undefined
      ? `
    -- Drop existing primary key if any
    FOR r IN (
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = format('%I.%I', v_table.schema, v_table.name)::regclass
      AND contype = 'p'
    ) LOOP
      execute format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
        v_table.schema, v_table.name, r.conname);
    END LOOP;

    ${
      primary_keys.length > 0
        ? `execute format('ALTER TABLE %I.%I ADD PRIMARY KEY (%s)',
            v_table.schema, v_table.name,
            ${literal(primary_keys.map((pk) => pk.name).join(', '))});`
        : ''
    }`
      : ''
  }

  ${
    comment !== undefined
      ? `execute format('COMMENT ON TABLE %I.%I IS %L',
          v_table.schema, v_table.name,
          ${literal(comment)});`
      : ''
  }

  ${
    schema !== undefined
      ? `execute format('ALTER TABLE %I.%I SET SCHEMA %I',
          v_table.schema, v_table.name,
          ${literal(schema)});`
      : ''
  }

  ${
    name !== undefined
      ? `
      if ${literal(name)} != v_table.name then
        execute format('ALTER TABLE %I.%I RENAME TO %I',
            ${schema !== undefined ? literal(schema) : 'v_table.schema'},
            v_table.name,
            ${literal(name)});
      end if;`
      : ''
  }
END $$;`

  return { sql }
}

export { list, retrieve, remove, create, update }
