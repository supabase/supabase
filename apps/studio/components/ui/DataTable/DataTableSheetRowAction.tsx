import { Column, Table } from '@tanstack/react-table'
import { endOfDay, endOfHour, startOfDay, startOfHour } from 'date-fns'
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  CalendarSearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftRightIcon,
  CopyIcon,
  EqualIcon,
  FilterIcon,
  type LucideIcon,
} from 'lucide-react'
import { ComponentPropsWithRef, useEffect, useState } from 'react'
import {
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import {
  addLogsFilter,
  EQUALITY_FILTER_OPERATORS,
  LOGS_FILTER_OPERATOR_LABELS,
  type LogsFilterOperator,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'

interface DataTableSheetRowActionProps<
  TData,
  TFields extends DataTableFilterField<TData>,
> extends ComponentPropsWithRef<typeof DropdownMenuTrigger> {
  fieldValue?: TFields['value']
  filterFields: TFields[]
  value: string | number
  table?: Table<TData>
  label?: string
  onAddFilter?: (operator: LogsFilterOperator) => void
  filterOperators?: readonly LogsFilterOperator[]
}

export const OPERATOR_ICONS: Partial<Record<LogsFilterOperator, LucideIcon>> = {
  '=': EqualIcon,
  '<>': ChevronsLeftRightIcon,
}

const FILTERABLE_FIELD_TYPES = ['checkbox', 'input', 'slider', 'timerange']

export function getRowFilterTarget<TData, TFields extends DataTableFilterField<TData>>({
  fieldValue,
  filterFields,
  table,
}: {
  fieldValue?: TFields['value']
  filterFields: TFields[]
  table?: Table<TData>
}): { field?: TFields; column?: Column<TData, unknown> } {
  if (!fieldValue) return {}
  const field = filterFields.find((f) => f.value === fieldValue)
  if (!field || !FILTERABLE_FIELD_TYPES.includes(field.type)) return {}
  return { field, column: table?.getAllColumns().find((c) => c.id === fieldValue.toString()) }
}

export type RowFilterAction = { operator: LogsFilterOperator; apply: () => void }

export function getRowFilterActions<TData, TFields extends DataTableFilterField<TData>>({
  fieldValue,
  filterFields,
  table,
  value,
  onAddFilter,
  filterOperators = EQUALITY_FILTER_OPERATORS,
}: {
  fieldValue?: TFields['value']
  filterFields: TFields[]
  table?: Table<TData>
  value: string | number
  onAddFilter?: (operator: LogsFilterOperator) => void
  filterOperators?: readonly LogsFilterOperator[]
}): RowFilterAction[] {
  const { field, column } = getRowFilterTarget({ fieldValue, filterFields, table })
  if (!!field && !!column && !!table) {
    if (field.type !== 'checkbox' && field.type !== 'input') return []
    return EQUALITY_FILTER_OPERATORS.map((operator) => ({
      operator,
      apply: () => addLogsFilter(table, { field: String(field.value), operator, value }),
    }))
  }
  if (!column && !!onAddFilter) {
    return filterOperators.map((operator) => ({ operator, apply: () => onAddFilter(operator) }))
  }
  return []
}

export function DataTableSheetRowAction<TData, TFields extends DataTableFilterField<TData>>({
  fieldValue,
  filterFields,
  value,
  children,
  className,
  table,
  label,
  onAddFilter,
  filterOperators = EQUALITY_FILTER_OPERATORS,
  onKeyDown,
  ...props
}: DataTableSheetRowActionProps<TData, TFields>) {
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

  const { field, column } = getRowFilterTarget({ fieldValue, filterFields, table })
  const filterActions = getRowFilterActions({
    fieldValue,
    filterFields,
    table,
    value,
    onAddFilter,
    filterOperators,
  })

  function renderFilterActions(actions: RowFilterAction[]) {
    return actions.map(({ operator, apply }) => {
      const Icon = OPERATOR_ICONS[operator] ?? FilterIcon
      return (
        <DropdownMenuItem key={operator} onClick={apply} className="flex items-center gap-2">
          <Icon size={12} />
          {LOGS_FILTER_OPERATOR_LABELS[operator]}
        </DropdownMenuItem>
      )
    })
  }

  function renderOptions() {
    if (!field) return null
    switch (field.type) {
      case 'checkbox':
      case 'input':
        return <DropdownMenuGroup>{renderFilterActions(filterActions)}</DropdownMenuGroup>
      case 'slider':
        return (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([0, value])}
              className="flex items-center gap-2"
            >
              {/* FIXME: change icon as it is not clear */}
              <ChevronLeftIcon size={12} />
              Less or equal than
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([value, 5000])}
              className="flex items-center gap-2"
            >
              {/* FIXME: change icon as it is not clear */}
              <ChevronRightIcon size={12} />
              Greater or equal than
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column?.setFilterValue([value])}
              className="flex items-center gap-2"
            >
              <EqualIcon size={12} />
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
              <CalendarSearchIcon size={12} />
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
              <CalendarClockIcon size={12} />
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
              <CalendarDaysIcon size={12} />
              Same day
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )
      default:
        return null
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn('focus-ring relative', className)}
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

      <DropdownMenuContent
        align="end"
        alignOffset={12}
        side="bottom"
        className="w-56"
        onKeyDown={(event) => event.stopPropagation()}
      >
        {!!field && !!column && (
          <>
            {renderOptions()}
            <DropdownMenuSeparator />
          </>
        )}
        {!column && filterActions.length > 0 && (
          <>
            <DropdownMenuGroup>{renderFilterActions(filterActions)}</DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onSelect={() => copyToClipboard(String(value))}
          className="flex items-center gap-2"
        >
          <CopyIcon size={12} />
          Copy {label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
