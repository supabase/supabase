import { z } from 'zod'
import { ident } from '../pg-format'
import { PGTable } from '../pg-meta-tables'
import { Query } from './Query'

// Constants
export const MAX_CHARACTERS = 10 * 1024 // 10KB

// Types for query building
export const sortZod = z.object({
  column: z.string(),
  table: z.string(),
  ascending: z.boolean(),
  nullsFirst: z.boolean(),
})

export const filterZod = z.object({
  column: z.string(),
  operator: z.enum(['=', '<>', '>', '<', '>=', '<=', '~~', '~~*', '!~~', '!~~*', 'in', 'is']),
  value: z.string().optional(),
})

export type Sort = z.infer<typeof sortZod>
export type Filter = z.infer<typeof filterZod>

export interface BuildTableRowsQueryArgs {
  table: PGTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
}

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

// Text and JSON types that should be truncated
export const TEXT_TYPES = ['text', 'varchar', 'char', 'character varying', 'character']
export const JSON_TYPES = ['json', 'jsonb']

// Threshold count for applying default sort
export const THRESHOLD_COUNT = 100000

// Return the primary key columns if exists, otherwise return the first column to use as a default sort
export const getDefaultOrderByColumns = (table: PGTable) => {
  const primaryKeyColumns = table.primary_keys.map((pk) => pk.name)
  if (primaryKeyColumns.length === 0 && table.columns && table.columns.length > 0) {
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
 * Get pagination parameters
 */
function getPagination(page: number, size?: number): { from: number; to: number } {
  const limit = size ?? 100
  const from = page * limit
  const to = page * limit + limit - 1
  return { from, to }
}

/**
 * Escape a string value for SQL
 * Note: This is a simple implementation. For production code,
 * consider using parameterized queries instead.
 */
function escapeSqlString(value: string): string {
  // Replace single quotes with two single quotes to escape them
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * Format filter value for SQL query based on the column data type
 */
function formatFilterValue(table: PGTable, filter: Filter): string {
  // If the value is null or undefined, return 'NULL'
  if (filter.value === undefined || filter.value === null) {
    return 'NULL'
  }

  // Find the column definition
  const column = table.columns?.find((col) => col.name === filter.column)

  // If column not found, default to string escaping
  if (!column) {
    return escapeSqlString(filter.value)
  }

  // Extract data type, removing array indicators and size constraints
  const baseDataType = column.data_type
    .toLowerCase()
    .replace(/\[\]$/, '') // Remove array notation
    .replace(/\(\d+\)/, '') // Remove size constraints like varchar(255)

  // ILIKE and NOT ILIKE operators can use wildcards, so we adjust the value
  if (filter.operator.toUpperCase() === 'ILIKE' || filter.operator.toUpperCase() === 'NOT ILIKE') {
    return escapeSqlString(`%${filter.value}%`)
  }

  // Format based on data type
  if (
    baseDataType.includes('int') ||
    baseDataType === 'numeric' ||
    baseDataType === 'decimal' ||
    baseDataType === 'real' ||
    baseDataType === 'double precision' ||
    baseDataType === 'float'
  ) {
    // Numeric types
    const num = parseFloat(filter.value)
    return isNaN(num) ? 'NULL' : num.toString()
  } else if (baseDataType === 'boolean') {
    // Boolean type
    return filter.value.toLowerCase() === 'true' ? 'true' : 'false'
  } else if (baseDataType.includes('json')) {
    // JSON types (json, jsonb)
    try {
      // Try to parse as JSON and stringify to ensure valid format
      const parsedJson = JSON.parse(filter.value)
      return `'${JSON.stringify(parsedJson).replace(/'/g, "''")}'::jsonb`
    } catch (e) {
      // If not valid JSON, treat as text
      return escapeSqlString(filter.value)
    }
  } else if (baseDataType.includes('time') || baseDataType.includes('date')) {
    // Date and timestamp types
    if (filter.value.toLowerCase() === 'now()') {
      return 'NOW()'
    } else {
      return escapeSqlString(filter.value)
    }
  } else if (baseDataType.includes('uuid')) {
    // UUID type
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(filter.value)) {
      return escapeSqlString(filter.value)
    } else {
      return 'NULL'
    }
  } else {
    // Default to string for all other types
    return escapeSqlString(filter.value)
  }
}

/**
 * Builds an optimized SQL query for table rows with efficient handling of large text fields
 * by applying truncation in the main query.
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
  if (!table.columns) {
    return ``
  }

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
      (column) => (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
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
  let queryChains = query.from(table.name, table.schema).select(selectClause)

  filters
    .filter((x) => x.value && x.value != '')
    .forEach((x) => {
      const value = formatFilterValue(table, x)
      queryChains = queryChains.filter(x.column, x.operator, value)
    })

  // If sorts is empty and table row count is within threshold, use the primary key as the default sort
  const liveRowCount = table.live_rows_estimate || 0
  if (sorts.length === 0 && liveRowCount <= THRESHOLD_COUNT && table.columns.length > 0) {
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

export default {
  shouldTruncateColumn,
  buildTableRowsQuery,
  getDefaultOrderByColumns,
}
