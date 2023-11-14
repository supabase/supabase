import { Filter, ServiceError, SupaTable } from 'components/grid'
import { ERROR_PRIMARY_KEY_NOTFOUND } from 'components/grid/constants'
import { isNumericalColumn } from 'components/grid/utils'
import { Table } from 'data/tables/table-query'
import { TableLike } from 'hooks/misc/useTable'

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

export function getPrimaryKeys({ table }: { table: Table }): {
  primaryKeys?: string[]
  error?: ServiceError
} {
  const pkColumns = table.primary_keys
  if (!pkColumns || pkColumns.length == 0) {
    return { error: { message: ERROR_PRIMARY_KEY_NOTFOUND } }
  }
  return { primaryKeys: pkColumns.map((x) => x.name) }
}
