import { X } from 'lucide-react'

import { Button } from 'ui'
import type { DataTableFilterField } from '../DataTable.types'
import { useDataTable } from '../providers/DataTableProvider'

export function DataTableFilterResetButton<TData>({ value: _value }: DataTableFilterField<TData>) {
  const { columnFilters, table } = useDataTable()
  const value = _value as string
  const column = table.getColumn(value)
  const filterValue = columnFilters.find((f) => f.id === value)?.value
  const filters = filterValue ? (Array.isArray(filterValue) ? filterValue : [filterValue]) : []

  if (filters.length === 0) return null

  return (
    <Button
      type="outline"
      icon={<X />}
      className="h-5 rounded-full px-1.5 py-1 font-mono text-[10px] [&>span]:-translate-y-[0.6px] space-x-1"
      onClick={(e) => {
        e.stopPropagation()
        column?.setFilterValue(undefined)
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
          column?.setFilterValue(undefined)
        }
      }}
    >
      {filters.length}
    </Button>
  )
}
