import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { coalesceRowsToArray, filterByList } from './helpers'
import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from './pg-format'
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

function getIdentifierWhereClause(identifier: TableIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  }
  if ('name' in identifier && identifier.name && identifier.schema) {
    return safeSql`${ident('name')} = ${literal(identifier.name)} and ${ident('schema')} = ${literal(identifier.schema)}`
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
  sql: SafeSqlFragment
  zod: z.ZodType<TableBasedOnIncludeColumns<T>[]>
} {
  let sql = generateEnrichedTablesSql({ includeColumns })
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
    zod: pgTableArrayZod,
  }
}

function retrieve(identifier: TableIdentifier): {
  sql: SafeSqlFragment
  zod: z.ZodType<TableWithColumns>
} {
  let whereClause = getIdentifierWhereClause(identifier)

  const sql = safeSql`${generateEnrichedTablesSql({ includeColumns: true })} where ${whereClause};`
  return {
    sql,
    zod: pgTableZod,
  }
}

function remove(
  table: Pick<PGTable, 'name' | 'schema'>,
  { cascade = false } = {}
): { sql: SafeSqlFragment } {
  const sql = safeSql`DROP TABLE ${ident(table.schema)}.${ident(table.name)} ${
    cascade ? safeSql`CASCADE` : safeSql`RESTRICT`
  };`
  return { sql }
}

const generateEnrichedTablesSql = ({ includeColumns }: { includeColumns?: boolean }) => safeSql`
  with tables as (${TABLES_SQL})
  ${includeColumns ? safeSql`, columns as (${COLUMNS_SQL})` : safeSql``}
  select
    *
    ${includeColumns ? safeSql`, ${coalesceRowsToArray('columns', safeSql`columns.table_id = tables.id`)}` : safeSql``}
  from tables`

type TableCreateParams = {
  name: string
  schema?: string
  comment?: string | null
  no_transaction?: boolean
}

function create({ name, schema = 'public', comment, no_transaction = false }: TableCreateParams): {
  sql: SafeSqlFragment
} {
  const tableSql = safeSql`CREATE TABLE ${ident(schema)}.${ident(name)} ();`
  const commentSql =
    comment != undefined
      ? safeSql`COMMENT ON TABLE ${ident(schema)}.${ident(name)} IS ${literal(comment)};`
      : safeSql``

  if (no_transaction) {
    const sql = safeSql`${tableSql} ${commentSql}`
    return { sql }
  }
  const sql = safeSql`BEGIN; ${tableSql} ${commentSql} COMMIT;`
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
  comment?: string | null
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
): { sql: SafeSqlFragment } {
  const alter = safeSql`ALTER TABLE ${ident(old.schema)}.${ident(old.name)}`
  const schemaSql =
    schema === undefined ? safeSql`` : safeSql`${alter} SET SCHEMA ${ident(schema)};`
  let nameSql = safeSql``
  if (name !== undefined && name !== old.name) {
    const currentSchema = schema === undefined ? old.schema : schema
    nameSql = safeSql`ALTER TABLE ${ident(currentSchema)}.${ident(old.name)} RENAME TO ${ident(name)};`
  }
  let enableRls = safeSql``
  if (rls_enabled !== undefined) {
    const enable = safeSql`${alter} ENABLE ROW LEVEL SECURITY;`
    const disable = safeSql`${alter} DISABLE ROW LEVEL SECURITY;`
    enableRls = rls_enabled ? enable : disable
  }
  let forceRls = safeSql``
  if (rls_forced !== undefined) {
    const enable = safeSql`${alter} FORCE ROW LEVEL SECURITY;`
    const disable = safeSql`${alter} NO FORCE ROW LEVEL SECURITY;`
    forceRls = rls_forced ? enable : disable
  }
  let replicaSql = safeSql``
  if (replica_identity === undefined) {
    // skip
  } else if (replica_identity === 'INDEX') {
    replicaSql = safeSql`${alter} REPLICA IDENTITY USING INDEX ${ident(replica_identity_index)};`
  } else {
    replicaSql = safeSql`${alter} REPLICA IDENTITY ${keyword(replica_identity)};`
  }
  let primaryKeysSql = safeSql``
  if (primary_keys === undefined) {
    // skip
  } else {
    primaryKeysSql = safeSql`${primaryKeysSql}
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
      primaryKeysSql = safeSql`${primaryKeysSql} ${alter} ADD PRIMARY KEY (${joinSqlFragments(
        primary_keys.map((x) => ident(x.name)),
        ','
      )});`
    }
  }
  const commentSql =
    comment == undefined
      ? safeSql``
      : safeSql`COMMENT ON TABLE ${ident(old.schema)}.${ident(old.name)} IS ${literal(comment)};`

  // nameSql must be last, right below schemaSql
  const sql = safeSql`
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

export { create, list, remove, retrieve, update }
