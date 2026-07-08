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
import { ComponentPropsWithRef, useEffect, useState } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import {
  isLogsFilterColumnValue,
  type LogsColumnFilterValue,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import CopyButton from '@/components/ui/CopyButton'
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
  const { copy } = useCopyToClipboard()
  const [open, setOpen] = useState(false)

  /**
   * [Joshen] This imo is just a temporary solution and needs to be addressed at the
   * UI component level RE how we want to handle DropdownContent when scrolling, as its
   * not specific to unified logs.
   *
   * DropdownMenuContent here exceeds the scrolling parent as its portalled. Opting to
   * close the dropdown menu here when scrolling as a workaround.
   */
  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [open])

  const field = !!fieldValue ? filterFields.find((f) => f.value === fieldValue) : undefined
  const column =
    !!fieldValue && !!field
      ? table.getAllColumns().find((c) => c.id === fieldValue.toString())
      : undefined

  function renderOptions() {
    if (!field) return null
    switch (field.type) {
      case 'checkbox':
        return (
          <DropdownMenuItem
            onClick={() => {
              // Equality filters use the wrapped { operator, values } shape so the
              // row action stays compatible with the FilterBar (which writes `=` and `<>`).
              const current = column?.getFilterValue()
              const existing: LogsColumnFilterValue = isLogsFilterColumnValue(current)
                ? current
                : { operator: '=', values: [] }
              const next: LogsColumnFilterValue = existing.values.includes(String(value))
                ? existing
                : { operator: existing.operator, values: [...existing.values, String(value)] }
              column?.setFilterValue(next)
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
            onClick={() =>
              column?.setFilterValue({
                operator: field.value === 'event_message' ? '~~*' : '=',
                values: [String(value)],
              } satisfies LogsColumnFilterValue)
            }
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

  if (!!field && !!column) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            'rounded-md ring-offset-background',
            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'relative py-0',
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
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" className="w-56">
          {renderOptions()}

          <DropdownMenuSeparator />

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

  return <CopyButton iconOnly variant="text" text={String(value)} className="px-1" />
}
