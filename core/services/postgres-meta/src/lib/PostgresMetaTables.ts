import { ident, literal } from 'pg-format'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants.js'
import { coalesceRowsToArray, filterByValue, filterByList } from './helpers.js'
import {
  PostgresMetaResult,
  PostgresTable,
  PostgresTableCreate,
  PostgresTableUpdate,
} from './types.js'
import { TABLES_SQL } from './sql/table.sql.js'
import { COLUMNS_SQL } from './sql/columns.sql.js'

export default class PostgresMetaTables {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async list(options: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns: false
  }): Promise<PostgresMetaResult<(PostgresTable & { columns: never })[]>>
  async list(options?: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns?: boolean
  }): Promise<PostgresMetaResult<(PostgresTable & { columns: unknown[] })[]>>
  async list({
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
  } = {}): Promise<PostgresMetaResult<PostgresTable[]>> {
    const schemaFilter = filterByList(
      includedSchemas,
      excludedSchemas,
      !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
    )
    const sql = generateEnrichedTablesSql({ includeColumns, schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresTable>>
  async retrieve({
    name,
    schema,
  }: {
    name: string
    schema: string
  }): Promise<PostgresMetaResult<PostgresTable>>
  async retrieve({
    id,
    name,
    schema = 'public',
  }: {
    id?: number
    name?: string
    schema?: string
  }): Promise<PostgresMetaResult<PostgresTable>> {
    const schemaFilter = schema ? filterByList([schema], []) : undefined
    if (id) {
      const idsFilter = filterByValue([id])
      const sql = generateEnrichedTablesSql({
        includeColumns: true,
        idsFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a table with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name) {
      const tableIdentifierFilter = filterByValue([`${schema}.${name}`])
      const sql = generateEnrichedTablesSql({
        schemaFilter,
        includeColumns: true,
        tableIdentifierFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return {
          data: null,
          error: { message: `Cannot find a table named ${name} in schema ${schema}` },
        }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on table retrieve' } }
    }
  }

  async create({
    name,
    schema = 'public',
    comment,
  }: PostgresTableCreate): Promise<PostgresMetaResult<PostgresTable>> {
    const tableSql = `CREATE TABLE ${ident(schema)}.${ident(name)} ();`
    const commentSql =
      comment === undefined
        ? ''
        : `COMMENT ON TABLE ${ident(schema)}.${ident(name)} IS ${literal(comment)};`
    const sql = `BEGIN; ${tableSql} ${commentSql} COMMIT;`
    const { error } = await this.query(sql)
    if (error) {
      return { data: null, error }
    }
    return await this.retrieve({ name, schema })
  }

  async update(
    id: number,
    {
      name,
      schema,
      rls_enabled,
      rls_forced,
      replica_identity,
      replica_identity_index,
      primary_keys,
      comment,
    }: PostgresTableUpdate
  ): Promise<PostgresMetaResult<PostgresTable>> {
    const { data: old, error } = await this.retrieve({ id })
    if (error) {
      return { data: null, error }
    }

    const alter = `ALTER TABLE ${ident(old!.schema)}.${ident(old!.name)}`
    const schemaSql = schema === undefined ? '' : `${alter} SET SCHEMA ${ident(schema)};`
    let nameSql = ''
    if (name !== undefined && name !== old!.name) {
      const currentSchema = schema === undefined ? old!.schema : schema
      nameSql = `ALTER TABLE ${ident(currentSchema)}.${ident(old!.name)} RENAME TO ${ident(name)};`
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
      if (old!.primary_keys.length !== 0) {
        primaryKeysSql += `
DO $$
DECLARE
  r record;
BEGIN
  SELECT conname
    INTO r
    FROM pg_constraint
    WHERE contype = 'p' AND conrelid = ${literal(id)};
  EXECUTE ${literal(`${alter} DROP CONSTRAINT `)} || quote_ident(r.conname);
END
$$;
`
      }

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
        : `COMMENT ON TABLE ${ident(old!.schema)}.${ident(old!.name)} IS ${literal(comment)};`
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
    {
      const { error } = await this.query(sql)
      if (error) {
        return { data: null, error }
      }
    }
    return await this.retrieve({ id })
  }

  async remove(id: number, { cascade = false } = {}): Promise<PostgresMetaResult<PostgresTable>> {
    const { data: table, error } = await this.retrieve({ id })
    if (error) {
      return { data: null, error }
    }
    const sql = `DROP TABLE ${ident(table!.schema)}.${ident(table!.name)} ${
      cascade ? 'CASCADE' : 'RESTRICT'
    };`
    {
      const { error } = await this.query(sql)
      if (error) {
        return { data: null, error }
      }
    }
    return { data: table!, error: null }
  }
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
