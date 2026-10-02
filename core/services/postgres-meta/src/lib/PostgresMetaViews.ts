import { DEFAULT_SYSTEM_SCHEMAS } from './constants.js'
import { coalesceRowsToArray, filterByList, filterByValue } from './helpers.js'
import { PostgresMetaResult, PostgresView } from './types.js'
import { VIEWS_SQL } from './sql/views.sql.js'
import { COLUMNS_SQL } from './sql/columns.sql.js'

export default class PostgresMetaViews {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

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
  } = {}): Promise<PostgresMetaResult<PostgresView[]>> {
    const schemaFilter = filterByList(
      includedSchemas,
      excludedSchemas,
      !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
    )
    const sql = generateEnrichedViewsSql({ includeColumns, schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresView>>
  async retrieve({
    name,
    schema,
  }: {
    name: string
    schema: string
  }): Promise<PostgresMetaResult<PostgresView>>
  async retrieve({
    id,
    name,
    schema = 'public',
  }: {
    id?: number
    name?: string
    schema?: string
  }): Promise<PostgresMetaResult<PostgresView>> {
    if (id) {
      const idsFilter = filterByValue([id])
      const sql = generateEnrichedViewsSql({
        includeColumns: true,
        idsFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a view with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name) {
      const viewIdentifierFilter = filterByValue([`${schema}.${name}`])
      const sql = generateEnrichedViewsSql({
        includeColumns: true,
        viewIdentifierFilter,
      })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return {
          data: null,
          error: { message: `Cannot find a view named ${name} in schema ${schema}` },
        }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on view retrieve' } }
    }
  }
}

const generateEnrichedViewsSql = ({
  includeColumns,
  schemaFilter,
  idsFilter,
  viewIdentifierFilter,
  limit,
  offset,
}: {
  includeColumns: boolean
  schemaFilter?: string
  idsFilter?: string
  viewIdentifierFilter?: string
  limit?: number
  offset?: number
}) => `
with views as (${VIEWS_SQL({ schemaFilter, limit, offset, viewIdentifierFilter, idsFilter })})
  ${includeColumns ? `, columns as (${COLUMNS_SQL({ schemaFilter, tableIdentifierFilter: viewIdentifierFilter, tableIdFilter: idsFilter })})` : ''}
select
  *
  ${includeColumns ? `, ${coalesceRowsToArray('columns', 'columns.table_id = views.id')}` : ''}
from views`
