import { Table } from '@tanstack/react-table'
import { endOfDay, endOfHour, startOfDay, startOfHour } from 'date-fns'
import {
  CalendarClock,
  CalendarDays,
  CalendarSearch,
  ChevronLeft,
  ChevronRight,
  Copy,
  Equal,
  Search,
} from 'lucide-react'
import { ComponentPropsWithRef } from 'react'

import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'
import { useCopyToClipboard } from 'hooks/ui/useCopyToClipboard'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface DataTableSheetRowActionProps<TData, TFields extends DataTableFilterField<TData>>
  extends ComponentPropsWithRef<typeof DropdownMenuTrigger> {
  fieldValue: TFields['value']
  filterFields: TFields[]
  value: string | number
  table: Table<TData>
}

export function DataTableSheetRowAction<TData, TFields extends DataTableFilterField<TData>>({
  fieldValue,
  filterFields,
  value,
  children,
  className,
  table,
  onKeyDown,
  ...props
}: DataTableSheetRowActionProps<TData, TFields>) {
  const { copy, isCopied } = useCopyToClipboard()
  const field = filterFields.find((field) => field.value === fieldValue)
  const column = table.getColumn(fieldValue.toString())

  if (!field || !column) return null

  function renderOptions() {
    if (!field) return null
    switch (field.type) {
      case 'checkbox':
        return (
          <DropdownMenuItem
            onClick={() => {
              const filterValue = column?.getFilterValue() as undefined | Array<unknown>
              const newValue = filterValue?.includes(value)
                ? filterValue
                : [...(filterValue || []), value]

              column?.setFilterValue(newValue)
            }}
            className="flex items-center gap-2"
          >
            <Search size={16} />
            Include
          </DropdownMenuItem>
        )
      case 'input':
        return (
          <DropdownMenuItem
            onClick={() => column?.setFilterValue(value)}
            className="flex items-center gap-2"
          >
            <Search size={16} />
            Include
          </DropdownMenuItem>
        )
      case 'slider':
        return (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([0, value])}
              className="flex items-center gap-2"
            >
              {/* FIXME: change icon as it is not clear */}
              <ChevronLeft size={16} />
              Less or equal than
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([value, 5000])}
              className="flex items-center gap-2"
            >
              {/* FIXME: change icon as it is not clear */}
              <ChevronRight size={16} />
              Greater or equal than
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([value])}
              className="flex items-center gap-2"
            >
              <Equal size={16} />
              Equal to
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )
      case 'timerange':
        const date = new Date(value)
        return (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([date])}
              className="flex items-center gap-2"
            >
              <CalendarSearch size={16} />
              Exact timestamp
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const start = startOfHour(date)
                const end = endOfHour(date)
                column?.setFilterValue([start, end])
              }}
              className="flex items-center gap-2"
            >
              <CalendarClock size={16} />
              Same hour
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const start = startOfDay(date)
                const end = endOfDay(date)
                column?.setFilterValue([start, end])
              }}
              className="flex items-center gap-2"
            >
              <CalendarDays size={16} />
              Same day
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )
      default:
        return null
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'relative',
          className
        )}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            // REMINDER: default behavior is to open the dropdown menu
            // But because we use it to navigate between rows, we need to prevent it
            // and only use "Enter" to select the option
            e.preventDefault()
          }
          onKeyDown?.(e)
        }}
        {...props}
      >
        {children}
        {isCopied ? (
          <div className="absolute inset-0 bg-background/70 place-content-center">Value copied</div>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-40">
        {renderOptions()}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => copy(String(value), { timeout: 1000 })}
          className="flex items-center gap-2"
        >
          <Copy size={16} />
          Copy value
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
