import { XIcon } from 'lucide-react'
import { Button } from 'ui'

import type { DataTableFilterField } from '../DataTable.types'
import { useDataTable } from '../providers/DataTableProvider'

export function DataTableFilterResetButton<TData>(field: DataTableFilterField<TData>) {
  const { columnFilters, table } = useDataTable()
  const value = field.value as string
  const column = table.getColumn(value)
  const filterValue = columnFilters.find((f) => f.id === value)?.value
  const filters = filterValue ? (Array.isArray(filterValue) ? filterValue : [filterValue]) : []

  const hasDuration = field.type === 'timerange' && field.durationSeconds != null
  if (filters.length === 0 && !hasDuration) return null
  const clear = () => {
    column?.setFilterValue(undefined)
    if (field.type === 'timerange') field.onClear?.()
  }

  return (
    <Button
      variant="outline"
      aria-label={`Clear ${field.label.toLowerCase()}`}
      icon={<XIcon />}
      className="h-5 rounded-full px-1.5 py-1 font-mono text-[10px] [&>span]:translate-y-[-0.6px] space-x-1"
      onClick={(e) => {
        e.stopPropagation()
        clear()
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
          clear()
        }
      }}
    >
      {hasDuration || (column?.columnDef.meta as Record<string, string>)?.dataType === 'date'
        ? 1
        : filters.length}
    </Button>
  )
}
