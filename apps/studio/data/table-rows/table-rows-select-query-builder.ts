import { Query } from 'components/grid/query/Query'
import { Filter, Sort, SupaTable } from 'components/grid/types'
import {
  JSON_TYPES,
  TEXT_TYPES,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import { KB } from 'lib/constants'
import { ImpersonationRole } from 'lib/role-impersonation'
import { getPagination } from '../utils/pagination'
import { formatFilterValue } from './utils'
import { THRESHOLD_COUNT } from './table-rows-count-query'
import { ident } from '@supabase/pg-meta/src/pg-format'

// Maximum number of characters to display for text/json fields
export const MAX_CHARACTERS = 10 * KB

// Additional PostgreSQL types that can hold large values and should be truncated
export const ADDITIONAL_LARGE_TYPES = [
  // Standard PostgreSQL types
  'bytea', // Binary data
  'xml', // XML data
  'hstore', // Key-value store
  'oid', // Object identifier for large objects
  'clob', // Character large object
  '_text', // Array of text
  '_varchar', // Array of varchar
  '_json', // Array of json
  '_jsonb', // Array of jsonb
  '_xml', // Array of XML
  'uuid[]', // Array of UUIDs
  'text[]', // Another way to denote text arrays
  'varchar[]', // Another way to denote varchar arrays

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

export interface BuildTableRowsQueryArgs {
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
  impersonatedRole?: ImpersonationRole
}

// return the primary key columns if exists, otherwise return the first column to use as a default sort
export const getDefaultOrderByColumns = (table: SupaTable) => {
  const primaryKeyColumns = table.columns.filter((col) => col?.isPrimaryKey).map((col) => col.name)
  if (primaryKeyColumns.length === 0) {
    return [table.columns[0]?.name]
  } else {
    return primaryKeyColumns
  }
}

/**
 * Determines if a column type should be truncated based on its format and dataType
 */
export const shouldTruncateColumn = (column: any): boolean => {
  // Check TEXT_TYPES and JSON_TYPES first
  if (TEXT_TYPES.includes(column.format) || JSON_TYPES.includes(column.format)) {
    return true
  }

  // Check if dataType is in the additional large types list
  if (ADDITIONAL_LARGE_TYPES.includes(column.dataType?.toLowerCase())) {
    return true
  }

  // Check if it's an array type that might contain large values
  if (column.dataType?.toLowerCase() === 'array') {
    return true
  }

  // Check for user-defined types or domain types that might be large
  if (column.format === 'user-defined' || column.format === 'domain') {
    return true
  }

  // Check if the dataType contains 'vector' (for embeddings) regardless of exact name
  if (column.dataType?.toLowerCase().includes('vector')) {
    return true
  }

  // Check if the dataType starts with an underscore (PostgreSQL array notation)
  if (column.dataType?.startsWith('_')) {
    return true
  }

  return false
}

/**
 * Builds an optimized SQL query for table rows with efficient handling of large text fields
 * by applying truncation in the main query instead of using a CTE.
 */
export const buildTableRowsQuery = ({
  table,
  filters = [],
  sorts = [],
  page,
  limit,
}: BuildTableRowsQueryArgs): string => {
  if (!table) return ``

  const query = new Query()

  // Get all column names
  const allColumnNames = table.columns.map((column) => column.name)

  // Identify columns that might need truncation
  const columnsToTruncate = table.columns
    .filter((column) => shouldTruncateColumn(column))
    .map((column) => column.name)

  // Create select expressions for each column, applying truncation only to needed columns
  const selectExpressions = allColumnNames.map((columnName) => {
    const escapedColumnName = ident(columnName)

    if (columnsToTruncate.includes(columnName)) {
      return `CASE
        WHEN octet_length(${escapedColumnName}::text) > ${MAX_CHARACTERS} 
        THEN left(${escapedColumnName}::text, ${MAX_CHARACTERS}) || '...'
        ELSE ${escapedColumnName}::text
      END AS ${escapedColumnName}`
    } else {
      return escapedColumnName
    }
  })

  // Handle array-based columns
  const arrayBasedColumnNames = table.columns
    .filter(
      (column) => (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
    )
    .map((column) => column.name)

  // Add array casting for array-based enum columns
  arrayBasedColumnNames.forEach((columnName) => {
    // Find this column in our select expressions
    const index = selectExpressions.findIndex(
      (expr) => expr === ident(columnName) || expr.startsWith(`CASE WHEN`)
    )
    if (index >= 0) {
      // If it's a column that needs truncation, we need to keep the truncation
      if (columnsToTruncate.includes(columnName)) {
        // We won't modify it, as we need to keep the truncation logic
      } else {
        // Otherwise just add the text[] cast
        selectExpressions[index] = `${ident(columnName)}::text[]`
      }
    }
  })

  const selectClause = selectExpressions.join(',')

  // Properly escape the table name and schema

  let queryChains = query.from(table.name, table.schema ?? undefined).select(selectClause)

  filters
    .filter((x) => x.value && x.value != '')
    .forEach((x) => {
      const value = formatFilterValue(table, x)
      queryChains = queryChains.filter(x.column, x.operator, value)
    })

  // If sorts is empty and table row count is within threshold, use the primary key as the default sort
  if (sorts.length === 0 && table.estimateRowCount <= THRESHOLD_COUNT && table.columns.length > 0) {
    const defaultOrderByColumns = getDefaultOrderByColumns(table)
    if (defaultOrderByColumns.length > 0) {
      defaultOrderByColumns.forEach((col) => {
        queryChains = queryChains.order(table.name, col, true, true)
      })
    }
  } else {
    sorts.forEach((x) => {
      queryChains = queryChains.order(x.table, x.column, x.ascending, x.nullsFirst)
    })
  }

  // getPagination is expecting to start from 0
  const { from, to } = getPagination((page ?? 1) - 1, limit)
  return queryChains.range(from, to).toSql()
}
