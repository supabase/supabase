import { useMemo } from 'react'
import type { DateRange } from 'react-day-picker'

import type { DataTableTimerangeFilterField } from '../DataTable.types'
import { isArrayOfDates } from '../DataTable.utils'
import { DatePickerWithRange } from '../DatePickerWithRange'
import { useDataTable } from '../providers/DataTableProvider'

export function DataTableFilterTimerange<TData>({
  value: _value,
  presets,
  dateRangeDisabled,
}: DataTableTimerangeFilterField<TData>) {
  const value = _value as string
  const { table, columnFilters } = useDataTable()
  const column = table.getColumn(value)
  const filterValue = columnFilters.find((i) => i.id === value)?.value

  const date: DateRange | undefined = useMemo(
    () =>
      filterValue instanceof Date
        ? { from: filterValue, to: undefined }
        : Array.isArray(filterValue) && isArrayOfDates(filterValue)
          ? { from: filterValue?.[0], to: filterValue?.[1] }
          : undefined,
    [filterValue]
  )

  const setDate = (date: DateRange | undefined) => {
    if (!date) return // TODO: remove from search params if columnFilter is removed
    if (date.from && !date.to) {
      column?.setFilterValue([date.from])
    }
    if (date.to && date.from) {
      column?.setFilterValue([date.from, date.to])
    }
  }

  return (
    <DatePickerWithRange dateRangeDisabled={dateRangeDisabled} {...{ date, setDate, presets }} />
  )
}
