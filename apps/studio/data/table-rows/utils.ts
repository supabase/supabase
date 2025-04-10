import type { Filter, ServiceError, SupaTable } from 'components/grid/types'
import { isNumericalColumn } from 'components/grid/utils/types'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'

/**
 * temporary fix until we implement a better filter UI
 * which validate input value base on the column type
 */
export function formatFilterValue(table: SupaTable, filter: Filter) {
  const column = table.columns.find((x) => x.name == filter.column)
  if (column && isNumericalColumn(column.format)) {
    const numberValue = Number(filter.value)
    // Supports BigInt filter values
    if (Number.isNaN(numberValue) || numberValue > Number.MAX_SAFE_INTEGER) return filter.value
    else return Number(filter.value)
  }
  return filter.value
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
