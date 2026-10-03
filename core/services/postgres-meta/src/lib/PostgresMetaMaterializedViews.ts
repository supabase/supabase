import { filterByList, coalesceRowsToArray, filterByValue } from './helpers.js'
import { PostgresMetaResult, PostgresMaterializedView } from './types.js'
import { MATERIALIZED_VIEWS_SQL } from './sql/materialized_views.sql.js'
import { COLUMNS_SQL } from './sql/columns.sql.js'

export default class PostgresMetaMaterializedViews {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async list({
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
    includeColumns = false,
  }: {
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns?: boolean
  } = {}): Promise<PostgresMetaResult<PostgresMaterializedView[]>> {
    const schemaFilter = filterByList(includedSchemas, excludedSchemas, undefined)
    let sql = generateEnrichedMaterializedViewsSql({ includeColumns, schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresMaterializedView>>
  async retrieve({
    name,
    schema,
  }: {
    name: string
    schema: string
  }): Promise<PostgresMetaResult<PostgresMaterializedView>>
  async retrieve({
    id,
    name,
    schema = 'public',
  }: {
    id?: number
    name?: string
    schema?: string
  }): Promise<PostgresMetaResult<PostgresMaterializedView>> {
    if (id) {
      const idsFilter = filterByValue([id])
      const sql = generateEnrichedMaterializedViewsSql({
        includeColumns: true,
        idsFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a materialized view with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name) {
      const materializedViewIdentifierFilter = filterByValue([`${schema}.${name}`])
      const sql = generateEnrichedMaterializedViewsSql({
        includeColumns: true,
        materializedViewIdentifierFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return {
          data: null,
          error: { message: `Cannot find a materialized view named ${name} in schema ${schema}` },
        }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on materialized view retrieve' } }
    }
  }
}

const generateEnrichedMaterializedViewsSql = ({
  includeColumns,
  schemaFilter,
  materializedViewIdentifierFilter,
  idsFilter,
  limit,
  offset,
}: {
  includeColumns: boolean
  schemaFilter?: string
  materializedViewIdentifierFilter?: string
  idsFilter?: string
  limit?: number
  offset?: number
}) => `
with materialized_views as (${MATERIALIZED_VIEWS_SQL({ schemaFilter, limit, offset, materializedViewIdentifierFilter, idsFilter })})
  ${includeColumns ? `, columns as (${COLUMNS_SQL({ schemaFilter, limit, offset, tableIdentifierFilter: materializedViewIdentifierFilter, tableIdFilter: idsFilter })})` : ''}
select
  *
  ${
    includeColumns
      ? `, ${coalesceRowsToArray('columns', 'columns.table_id = materialized_views.id')}`
      : ''
  }
from materialized_views`
