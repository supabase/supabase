import type { Filter, ServiceError, SupaTable } from 'components/grid/types'
import { isNumericalColumn } from 'components/grid/utils/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'

/**
 * Format filter value based on column type
 * Handle foreign keys by ensuring they're properly formatted for the target column
 */
export function formatFilterValue(table: SupaTable, filter: Filter) {
  const column = table.columns.find((x) => x.name == filter.column)
  if (!column) {
    console.log(`formatFilterValue: No column found for ${filter.column}`)
    return filter.value
  }

  console.log(`Formatting filter for column ${filter.column} (${column.format}):`, {
    originalValue: filter.value,
    operator: filter.operator,
  })

  // Handle numerical columns
  if (isNumericalColumn(column.format)) {
    const numberValue = Number(filter.value)
    // Supports BigInt filter values
    if (Number.isNaN(numberValue) || numberValue > Number.MAX_SAFE_INTEGER) {
      console.log(`Keeping as string for large/invalid number: ${filter.value}`)
      return filter.value
    } else {
      console.log(`Converting to number: ${filter.value} -> ${numberValue}`)
      return Number(filter.value)
    }
  }

  // Check if this is a foreign key column
  const isForeignKey = hasForeignKeyRelationship(table, filter.column)
  if (isForeignKey) {
    console.log(`Column ${filter.column} is a foreign key`)

    // Foreign keys should match the target column type
    // For UUID formats, ensure no spaces
    if (column.format === 'uuid' && typeof filter.value === 'string') {
      const trimmed = filter.value.trim()
      console.log(`Trimming UUID value: "${filter.value}" -> "${trimmed}"`)
      return trimmed
    }

    // For numeric foreign keys that might be passed as strings from the UI
    if (isNumericalColumn(column.format) && !isNaN(Number(filter.value))) {
      const numberValue = Number(filter.value)
      console.log(`Converting FK string to number: ${filter.value} -> ${numberValue}`)
      return numberValue
    }
  }

  console.log(`Using original value for ${filter.column}: ${filter.value}`)
  return filter.value
}

/**
 * Check if a column has a foreign key relationship
 */
function hasForeignKeyRelationship(table: SupaTable, columnName: string): boolean {
  if (!table) return false

  // Access relationships if they exist on the table
  const relationships = (table as any)?.relationships

  if (!relationships || !Array.isArray(relationships)) return false

  const hasFK = relationships.some((rel: any) => rel.source_column_name === columnName)
  console.log(`Column ${columnName} foreign key check:`, { hasFK, relationships })
  return hasFK
}

export function getPrimaryKeys({ table }: { table: Entity }): {
  primaryKeys?: string[]
  error?: ServiceError
} {
  if (!isTableLike(table)) {
    return {
      error: { message: 'Only table rows can be updated or deleted' },
    }
  }

  const pkColumns = table.primary_keys
  if (!pkColumns || pkColumns.length == 0) {
    return {
      error: { message: 'Please add a primary key column to your table to update or delete rows' },
    }
  }
  return { primaryKeys: pkColumns.map((x) => x.name) }
}
