import { XIcon } from 'lucide-react'
import { Button } from 'ui'

import type { DataTableFilterField } from '../DataTable.types'
import { findTableColumn, setColumnFilterValue } from '../DataTable.utils'
import { useDataTable } from '../providers/DataTableProvider'

export function DataTableFilterResetButton<TData>({ value: _value }: DataTableFilterField<TData>) {
  const { columnFilters, table } = useDataTable()
  const value = _value as string
  const column = findTableColumn(table, value)
  const filterValue = columnFilters.find((f) => f.id === value)?.value
  const filters = filterValue ? (Array.isArray(filterValue) ? filterValue : [filterValue]) : []

  if (filters.length === 0) return null

  return (
    <Button
      variant="outline"
      icon={<XIcon />}
      className="h-5 rounded-full px-1.5 py-1 font-mono text-[10px] [&>span]:translate-y-[-0.6px] space-x-1"
      onClick={(e) => {
        e.stopPropagation()
        setColumnFilterValue(table, value, undefined)
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
          setColumnFilterValue(table, value, undefined)
        }
      }}
    >
      {(column?.columnDef.meta as Record<string, string>)?.dataType === 'date' ? 1 : filters.length}
    </Button>
  )
}
