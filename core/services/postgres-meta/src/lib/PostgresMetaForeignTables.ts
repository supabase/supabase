import { coalesceRowsToArray, filterByList, filterByValue } from './helpers.js'
import { PostgresMetaResult, PostgresForeignTable } from './types.js'
import { FOREIGN_TABLES_SQL } from './sql/foreign_tables.sql.js'
import { COLUMNS_SQL } from './sql/columns.sql.js'

export default class PostgresMetaForeignTables {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async list(options: {
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns: false
  }): Promise<PostgresMetaResult<(PostgresForeignTable & { columns: never })[]>>
  async list(options?: {
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns?: boolean
  }): Promise<PostgresMetaResult<(PostgresForeignTable & { columns: unknown[] })[]>>
  async list({
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
    includeColumns = true,
  }: {
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns?: boolean
  } = {}): Promise<PostgresMetaResult<PostgresForeignTable[]>> {
    const schemaFilter = filterByList(includedSchemas, excludedSchemas)
    const sql = generateEnrichedForeignTablesSql({ includeColumns, schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresForeignTable>>
  async retrieve({
    name,
    schema,
  }: {
    name: string
    schema: string
  }): Promise<PostgresMetaResult<PostgresForeignTable>>
  async retrieve({
    id,
    name,
    schema = 'public',
  }: {
    id?: number
    name?: string
    schema?: string
  }): Promise<PostgresMetaResult<PostgresForeignTable>> {
    if (id) {
      const idsFilter = filterByValue([`${id}`])
      const sql = generateEnrichedForeignTablesSql({
        includeColumns: true,
        idsFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a foreign table with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name) {
      const nameFilter = filterByValue([`${schema}.${name}`])
      const sql = generateEnrichedForeignTablesSql({
        includeColumns: true,
        tableIdentifierFilter: nameFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return {
          data: null,
          error: { message: `Cannot find a foreign table named ${name} in schema ${schema}` },
        }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on foreign table retrieve' } }
    }
  }
}

const generateEnrichedForeignTablesSql = ({
  includeColumns,
  schemaFilter,
  idsFilter,
  tableIdentifierFilter,
  limit,
  offset,
}: {
  includeColumns: boolean
  schemaFilter?: string
  idsFilter?: string
  tableIdentifierFilter?: string
  limit?: number
  offset?: number
}) => `
with foreign_tables as (${FOREIGN_TABLES_SQL({ schemaFilter, tableIdentifierFilter, limit, offset })})
  ${includeColumns ? `, columns as (${COLUMNS_SQL({ schemaFilter, tableIdentifierFilter, tableIdFilter: idsFilter })})` : ''}
select
  *
  ${
    includeColumns
      ? `, ${coalesceRowsToArray('columns', 'columns.table_id = foreign_tables.id')}`
      : ''
  }
from foreign_tables`
