import { DropdownMenu } from 'ui'
import { Copy } from 'lucide-react'
import { DropdownMenuContent, DropdownMenuSeparator } from 'ui'
import { DropdownMenuGroup, DropdownMenuItem } from 'ui'
import { DropdownMenuTrigger } from 'ui'
import { CalendarSearch, ChevronLeft, ChevronRight, Equal, Search } from 'lucide-react'
import { CalendarDays } from 'lucide-react'
import { startOfDay } from 'date-fns'
import { startOfHour } from 'date-fns'
import { useCopyToClipboard } from 'components/interfaces/DataTableDemo/hooks/use-copy-to-clipboard'
import { endOfDay } from 'date-fns'
import { Table } from '@tanstack/react-table'
import { CalendarClock } from 'lucide-react'
import { endOfHour } from 'date-fns'
import { cn } from 'ui'
import { DataTableFilterField } from '../types'

interface DataTableSheetRowActionProps<TData, TFields extends DataTableFilterField<TData>>
  extends React.ComponentPropsWithRef<typeof DropdownMenuTrigger> {
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
              // FIXME:
              const filterValue = column?.getFilterValue() as undefined | Array<unknown>
              const newValue = filterValue?.includes(value)
                ? filterValue
                : [...(filterValue || []), value]

              column?.setFilterValue(newValue)
            }}
          >
            <Search />
            Include
          </DropdownMenuItem>
        )
      case 'input':
        return (
          <DropdownMenuItem onClick={() => column?.setFilterValue(value)}>
            <Search />
            Include
          </DropdownMenuItem>
        )
      case 'slider':
        return (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => column?.setFilterValue([0, value])}>
              {/* FIXME: change icon as it is not clear */}
              <ChevronLeft />
              Less or equal than
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column?.setFilterValue([value, 5000])}>
              {/* FIXME: change icon as it is not clear */}
              <ChevronRight />
              Greater or equal than
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column?.setFilterValue([value])}>
              <Equal />
              Equal to
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )
      case 'timerange':
        const date = new Date(value)
        return (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => column?.setFilterValue([date])}>
              <CalendarSearch />
              Exact timestamp
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const start = startOfHour(date)
                const end = endOfHour(date)
                column?.setFilterValue([start, end])
              }}
            >
              <CalendarClock />
              Same hour
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const start = startOfDay(date)
                const end = endOfDay(date)
                column?.setFilterValue([start, end])
              }}
            >
              <CalendarDays />
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
      <DropdownMenuContent align="start" side="left">
        {renderOptions()}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copy(String(value), { timeout: 1000 })}>
          <Copy />
          Copy value
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
