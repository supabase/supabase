import { Filter, SupaTable } from 'components/grid'
import { isNumericalColumn } from 'components/grid/utils'

/**
 * temporary fix until we implement a better filter UI
 * which validate input value base on the column type
 */
export function formatFilterValue(table: SupaTable, filter: Filter) {
  const column = table.columns.find((x) => x.name == filter.column)
  if (column && isNumericalColumn(column.format)) {
    const numberValue = Number(filter.value)
    if (Number.isNaN(numberValue)) return filter.value
    else return Number(filter.value)
  }
  return filter.value
}
