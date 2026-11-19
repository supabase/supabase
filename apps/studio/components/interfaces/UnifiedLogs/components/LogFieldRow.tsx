import type { Table } from '@tanstack/react-table'
import { MoreHorizontalIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMedia } from 'react-use'
import { cn } from 'ui'

import type { LogsFilterOperator } from '../UnifiedLogs.filters'
import type { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableSheetRowAction } from '@/components/ui/DataTable/DataTableSheetRowAction'

const HOVER_ACTIONS_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 768px)'

interface LogFieldRowProps<TData> {
  label: string
  /** Value to copy, and to filter by when `fieldValue` is set. */
  value: string | number
  /** Rendered value; defaults to `value`. */
  children?: ReactNode
  /** Filter field id; omit for copy-only rows. */
  fieldValue?: DataTableFilterField<TData>['value']
  filterFields: DataTableFilterField<TData>[]
  table?: Table<TData>
  disabled?: boolean
  /** Truncate the label to one line instead of wrapping it. */
  truncateLabel?: boolean
  onAddFilter?: (operator: LogsFilterOperator) => void
  filterOperators?: readonly LogsFilterOperator[]
  /** `menu` keeps the dropdown on every device, for surfaces without hover actions. */
  actionsMode?: 'hover' | 'menu'
  className?: string
}

/** Key/value row for a log field, offering copy and filter actions. */
export function LogFieldRow<TData>({
  label,
  value,
  children,
  fieldValue,
  filterFields,
  table,
  disabled,
  truncateLabel = false,
  onAddFilter,
  filterOperators,
  actionsMode = 'hover',
  className,
}: LogFieldRowProps<TData>) {
  const isHoverDevice = useMedia(HOVER_ACTIONS_QUERY, false)
  const canUseHoverActions = actionsMode === 'hover' && isHoverDevice && !disabled
  const triggerProps = { role: 'button', tabIndex: disabled ? -1 : 0 } as const

  const row = (
    <div
      {...(canUseHoverActions ? {} : triggerProps)}
      className={cn(
        'group/field relative flex min-w-0 flex-1 items-start justify-between gap-4 px-4 py-2',
        'hover:bg-surface-200 data-[state=open]:bg-surface-200 has-[[data-state=open]]:bg-surface-200',
        !canUseHoverActions && 'cursor-pointer',
        className
      )}
    >
      <span
        className={cn(
          'min-w-0 flex-1 font-sans text-xs leading-5 text-foreground-lighter',
          truncateLabel ? 'truncate' : 'break-all'
        )}
      >
        {label}
      </span>{' '}
      <span
        className={cn(
          'flex min-w-0 flex-[2] justify-end text-right text-xs leading-5 transition-transform',
          canUseHoverActions &&
            'group-hover/field:-translate-x-9 group-has-[[data-state=open]]/field:-translate-x-9'
        )}
      >
        {children ?? value}
      </span>
      {canUseHoverActions && (
        <div
          className={cn(
            'absolute right-4 top-2 opacity-0',
            'focus-within:opacity-100 group-hover/field:opacity-100 has-[[data-state=open]]:opacity-100'
          )}
        >
          <DataTableSheetRowAction
            fieldValue={fieldValue}
            filterFields={filterFields}
            table={table}
            value={value}
            label={label}
            onAddFilter={onAddFilter}
            filterOperators={filterOperators}
          >
            <button
              type="button"
              tabIndex={0}
              aria-label={`Actions for ${label}`}
              className={cn(
                'focus-ring flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm',
                'text-foreground-lighter hover:bg-selection hover:text-foreground'
              )}
            >
              <MoreHorizontalIcon size={12} />
            </button>
          </DataTableSheetRowAction>
        </div>
      )}
    </div>
  )

  if (canUseHoverActions) return row

  return (
    <DataTableSheetRowAction
      fieldValue={fieldValue}
      filterFields={filterFields}
      table={table}
      value={value}
      label={label}
      disabled={disabled}
      className="rounded-none"
      onAddFilter={onAddFilter}
      filterOperators={filterOperators}
    >
      {row}
    </DataTableSheetRowAction>
  )
}
