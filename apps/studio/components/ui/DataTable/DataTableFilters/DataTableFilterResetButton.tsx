import { X } from 'lucide-react'

import { Button } from 'ui'
import type { DataTableFilterField } from '../DataTable.types'
import { useDataTable } from '../providers/DataTableProvider'

export function DataTableFilterResetButton<TData>({ value: _value }: DataTableFilterField<TData>) {
  const { columnFilters, table } = useDataTable()
  const value = _value as string
  const column = table.getColumn(value)
  const filterValue = columnFilters.find((f) => f.id === value)?.value

  // TODO: check if we could useMemo
  const filters = filterValue ? (Array.isArray(filterValue) ? filterValue : [filterValue]) : []

  if (filters.length === 0) return null

  return (
    <Button
      type="outline"
      className="h-5 rounded-full px-1.5 py-1 font-mono text-[10px]"
      onClick={(e) => {
        e.stopPropagation()
        column?.setFilterValue(undefined)
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.code === 'Enter') {
          column?.setFilterValue(undefined)
        }
      }}
      icon={<X className="h-2.5 w-2.5 text-muted-foreground" />}
      asChild
    >
      {/* REMINDER: `AccordionTrigger` is also a button(!) and we get Hydration error when rendering button within button */}
      <div role="button" tabIndex={0}>
        <span>{filters.length}</span>
      </div>
    </Button>
  )
}
