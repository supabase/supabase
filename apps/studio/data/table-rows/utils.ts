import type { Filter, ServiceError } from '@/components/grid/types'
import { isNumericalColumn } from '@/components/grid/utils/types'
import { Entity, isTableLike } from '@/data/table-editor/table-editor-types'

/**
 * temporary fix until we implement a better filter UI
 * which validate input value base on the column type
 */
export function formatFilterValue(
  table: {
    columns: {
      name: string
      format: string
    }[]
  },
  filter: Filter
) {
  const column = table.columns.find((x) => x.name == filter.column)
  if (column && isNumericalColumn(column.format)) {
    const numberValue = Number(filter.value)
    // Keep the original string for values that can't be represented exactly as
    // a JS number (e.g. large bigints), otherwise Number() silently loses
    // precision and we'd filter on the wrong value. This must guard both the
    // positive and negative ends of the safe-integer range — checking only the
    // upper bound let large negative bigints (e.g. the int8 minimum
    // -9223372036854775808) slip through and get rounded.
    if (Number.isNaN(numberValue) || Math.abs(numberValue) > Number.MAX_SAFE_INTEGER)
      return filter.value
    else return numberValue
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
