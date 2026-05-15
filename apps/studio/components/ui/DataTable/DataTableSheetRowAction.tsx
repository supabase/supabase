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
  Filter,
} from 'lucide-react'
import { ComponentPropsWithRef } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { useCopyToClipboard } from '@/hooks/ui/useCopyToClipboard'

interface DataTableSheetRowActionProps<
  TData,
  TFields extends DataTableFilterField<TData>,
> extends ComponentPropsWithRef<typeof DropdownMenuTrigger> {
  fieldValue?: TFields['value']
  filterFields: TFields[]
  value: string | number
  table: Table<TData>
  label?: string
}

export function DataTableSheetRowAction<TData, TFields extends DataTableFilterField<TData>>({
  fieldValue,
  filterFields,
  value,
  children,
  className,
  table,
  label,
  onKeyDown,
  ...props
}: DataTableSheetRowActionProps<TData, TFields>) {
  const { copy, isCopied } = useCopyToClipboard()
  const field = !!fieldValue ? filterFields.find((f) => f.value === fieldValue) : undefined
  const column = !!fieldValue ? table.getColumn(fieldValue.toString()) : undefined

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
            <Filter size={12} />
            Add as filter for {column?.id}
          </DropdownMenuItem>
        )
      case 'input':
        return (
          <DropdownMenuItem
            onClick={() => column?.setFilterValue(value)}
            className="flex items-center gap-2"
          >
            <Filter size={12} />
            Add as filter for {column?.id}
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
              <ChevronLeft size={12} />
              Less or equal than
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([value, 5000])}
              className="flex items-center gap-2"
            >
              {/* FIXME: change icon as it is not clear */}
              <ChevronRight size={12} />
              Greater or equal than
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([value])}
              className="flex items-center gap-2"
            >
              <Equal size={12} />
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
              <CalendarSearch size={12} />
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
              <CalendarClock size={12} />
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
              <CalendarDays size={12} />
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
          'rounded-md ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-surface-100/80 backdrop-blur-sm animate-in fade-in duration-150">
            <span className="font-mono text-xs text-foreground-light">Copied</span>
          </div>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="bottom" className="w-48 -translate-x-4">
        {!!field && !!column && (
          <>
            {renderOptions()}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => copy(String(value), { timeout: 1000 })}
          className="flex items-center gap-2"
        >
          <Copy size={12} />
          Copy {label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
