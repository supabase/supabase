'use client'

import { useMemo } from 'react'
import type { DataTableTimerangeFilterField } from './types'
import { isArrayOfDates } from 'components/interfaces/DataTableDemo/lib/is-array'
import { DatePickerWithRange } from 'components/interfaces/DataTableDemo/components/custom/date-picker-with-range'
import type { DateRange } from 'react-day-picker'
import { useDataTable } from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'

export function DataTableFilterTimerange<TData>({
  value: _value,
  presets,
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

  return <DatePickerWithRange {...{ date, setDate, presets }} />
}
