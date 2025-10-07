import { ident } from '../pg-format'
import { PGForeignTable } from '../pg-meta-foreign-tables'
import { PGMaterializedView } from '../pg-meta-materialized-views'
import { PGTable } from '../pg-meta-tables'
import { PGView } from '../pg-meta-views'
import { Query } from './Query'
import { Filter, Sort } from './types'

// Constants
export const MAX_CHARACTERS = 10 * 1024 // 10KB
// Max array size
export const MAX_ARRAY_SIZE = 50

export type TableLikeEntity = PGTable | PGView | PGForeignTable | PGMaterializedView

export interface BuildTableRowsQueryArgs {
  table: TableLikeEntity
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
  maxCharacters?: number
  maxArraySize?: number
}

// Text and JSON types that should be truncated
export const TEXT_TYPES = ['text', 'varchar', 'char', 'character varying', 'character']
export const JSON_TYPES = ['json', 'jsonb']
const JSON_SET = new Set(JSON_TYPES)

// Additional PostgreSQL types that can hold large values and should be truncated
export const ADDITIONAL_LARGE_TYPES = [
  // Standard PostgreSQL types
  'bytea', // Binary data
  'xml', // XML data
  'hstore', // Key-value store
  'clob', // Character large object

  // Extension-specific types
  // pgvector extension (for AI/ML/RAG applications)
  'vector', // Vector type used for embeddings

  // PostGIS extension types
  'geometry', // Spatial data type
  'geography', // Spatial data type

  // Full-text search types
  'tsvector', // Text search vector
  'tsquery', // Text search query

  // Range types
  'daterange', // Date range
  'tsrange', // Timestamp range
  'tstzrange', // Timestamp with timezone range
  'numrange', // Numeric range
  'int4range', // Integer range
  'int8range', // Bigint range

  // Other extension types
  'cube', // Multi-dimensional cube
  'ltree', // Label tree
  'lquery', // Label tree query
  'jsonpath', // JSON path expressions
  'citext', // Case-insensitive text
]

export const LARGE_COLUMNS_TYPES = [...TEXT_TYPES, ...JSON_TYPES, ...ADDITIONAL_LARGE_TYPES]
const LARGE_COLUMNS_TYPES_SET = new Set(LARGE_COLUMNS_TYPES)

// Threshold count for applying default sort
export const THRESHOLD_COUNT = 100000

// Return the primary key columns if exists, otherwise return the first column to use as a default sort
export const getDefaultOrderByColumns = (table: Pick<PGTable, 'primary_keys' | 'columns'>) => {
  const primaryKeyColumns = table.primary_keys?.map((pk) => pk.name)
  if (primaryKeyColumns && primaryKeyColumns.length > 0) {
    return primaryKeyColumns
  }
  if (table.columns && table.columns.length > 0) {
    const eligibleColumnsForSorting = table.columns.filter((x) => !x.data_type.includes('json'))
    if (eligibleColumnsForSorting.length > 0) return [eligibleColumnsForSorting[0].name]
    else return []
  }
  return []
}

/**
 * Determines if a column type should be truncated based on its format and dataType
 * Be aware if the logic in RowEditor.utils.ts -> isValueTruncated needs to be revised
 * if we're updating the truncation logic, as it'll affect whether the Table Editor displays
 * the data as truncated or not
 */
export const shouldTruncateColumn = (columnFormat: string): boolean =>
  LARGE_COLUMNS_TYPES_SET.has(columnFormat.toLowerCase())

export const DEFAULT_PAGE_SIZE = 100

export function getPagination(page?: number, size: number = DEFAULT_PAGE_SIZE) {
  const limit = size
  const from = page ? page * limit : 0
  const to = page ? from + size - 1 : size - 1

  return { from, to }
}

export const getTableRowsSql = ({
  table,
  filters = [],
  sorts = [],
  page,
  limit,
  maxCharacters = MAX_CHARACTERS,
  maxArraySize = MAX_ARRAY_SIZE,
}: BuildTableRowsQueryArgs) => {
  if (!table || !table.columns) return ``

  const query = new Query()

  // Properly escape the table name and schema
  let queryChains = query.from(table.name, table.schema).select()

  filters.forEach((x) => {
    const col = table.columns?.find((y) => y.name === x.column)
    const isStringTypeColumn = !!col ? TEXT_TYPES.includes(col.format) : true
    queryChains = queryChains.filter(
      x.column,
      x.operator,
      !isStringTypeColumn && x.value === '' ? null : x.value
    )
  })

  // If sorts is empty and table row count is within threshold, use the primary key as the default sort
  // Only apply for selections over a Table, not View, MaterializedViews, ...
  const liveRowCount = (table as PGTable).live_rows_estimate || 0
  if (sorts.length === 0 && liveRowCount <= THRESHOLD_COUNT && table.columns.length > 0) {
    const defaultOrderByColumns = getDefaultOrderByColumns(table as PGTable)
    if (defaultOrderByColumns.length > 0) {
      defaultOrderByColumns.forEach((col) => {
        queryChains = queryChains.order(table.name, col)
      })
    }
  } else {
    sorts.forEach((x) => {
      queryChains = queryChains.order(x.table, x.column, x.ascending, x.nullsFirst)
    })
  }

  // getPagination is expecting to start from 0
  const { from, to } = getPagination((page ?? 1) - 1, limit)

  // To have efficient query, we use CTE optimization, to first reduce the number of rows and order them in the right place
  // filtering, applying limits and order by, then we can apply selection with some conditional logic to truncate large columns
  // allowing postgres to only truncate the columns within the subset that we'll return instead of attemting to do it on
  // all the rows within the table
  const baseSelectQuery = `with _base_query as (${queryChains.range(from, to).toSql({ isCTE: false, isFinal: false })})`

  const allColumnNames = table.columns
    .sort((a, b) => a.ordinal_position - b.ordinal_position)
    .map((column) => ({ name: column.name, format: column.format.toLowerCase() }))

  // Identify columns that might need truncation
  const columnsToTruncate = table.columns
    .filter((column) => shouldTruncateColumn(column.format))
    .map((column) => column.name)

  // Create select expressions for each column, applying truncation only to needed columns
  const selectExpressions = allColumnNames.map(({ name: columnName }) => {
    const escapedColumnName = ident(columnName)

    if (columnsToTruncate.includes(columnName)) {
      return `case
        when octet_length(${escapedColumnName}::text) > ${maxCharacters} 
        then left(${escapedColumnName}::text, ${maxCharacters}) || '...'
        else ${escapedColumnName}::text
      end as ${escapedColumnName}`
    } else {
      return escapedColumnName
    }
  })

  // Handle array-based columns
  const arrayBasedColumns = table.columns
    .filter((column) => column.data_type.toLowerCase() === 'array')
    // remove the _ prefix for array based format
    .map((column) => ({ name: column.name, format: column.format.toLowerCase().slice(1) }))

  // Add array casting for array-based enum columns
  arrayBasedColumns.forEach(({ name: columnName, format }) => {
    // Find this column in our select expressions
    const index = selectExpressions.findIndex(
      (expr) => expr === ident(columnName) // if the column is selected without any truncation applied to it
    )
    // If the column is a json, the final cast remain an array of json
    const typeCast = JSON_SET.has(format) ? `${format}[]` : 'text[]'
    const lastElement =
      typeCast === 'text[]' ? `array['...']` : `array['{"truncated": true}'::json]`
    if (index >= 0) {
      // We cast to text[] but limit the array size if the total size of the array is too large (same logic than for text fields)
      // This returns the first MAX_ARRAY_SIZE elements of the array (adjustable) and adds '...' if truncated
      // NOTE: this is not optimal, as the first element in the array could still be very large (more than 10Kb) and in such case
      // the trimming might fail.
      // Also handle multi-dimentionals array truncation, but won't happen the extra `...` element to it as we can't determine what's
      // the right number of items to generate within the array. Studio side, we'll consider any multi-dimentional array as possibly
      // truncated.
      selectExpressions[index] = `
        case 
          when octet_length(${ident(columnName)}::text) > ${maxCharacters} 
          then
            case
              when array_ndims(${ident(columnName)}) = 1
              then
                (select array_cat(${ident(columnName)}[1:${maxArraySize}]::${typeCast}, ${lastElement}::${typeCast}))::${typeCast}
              else
                ${ident(columnName)}[1:${maxArraySize}]::${typeCast}
            end
          else ${ident(columnName)}::${typeCast}
        end
      `
    }
  })

  const selectClause = selectExpressions.join(',')
  const finalQuery = new Query()
  // Now, we apply our selection logic with the tables truncation on the _base_query constructed before
  const finalQueryChain = finalQuery.from('_base_query').select(selectClause)
  return `${baseSelectQuery}
  ${finalQueryChain.toSql({ isCTE: true, isFinal: true })}`
}

export default {
  shouldTruncateColumn,
  getTableRowsSql,
  getDefaultOrderByColumns,
}
