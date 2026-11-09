import type { Table } from '@tanstack/react-table'
import { CopyIcon, FilterIcon, type LucideIcon } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { useMedia } from 'react-use'
import { cn, copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { LOGS_FILTER_OPERATOR_VERBS, type LogsFilterOperator } from '../UnifiedLogs.filters'
import type { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import {
  DataTableSheetRowAction,
  getRowFilterActions,
  OPERATOR_ICONS,
} from '@/components/ui/DataTable/DataTableSheetRowAction'

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
  className,
}: LogFieldRowProps<TData>) {
  const isHoverDevice = useMedia(HOVER_ACTIONS_QUERY, false)
  const filterActions = getRowFilterActions({
    fieldValue,
    filterFields,
    table,
    value,
    onAddFilter,
    filterOperators,
  })
  const canUseHoverActions = isHoverDevice && !disabled
  const triggerProps = { role: 'button', tabIndex: disabled ? -1 : 0 } as const

  const row = (
    <div
      {...(canUseHoverActions ? {} : triggerProps)}
      className={cn(
        'group/field relative flex min-w-0 flex-1 items-start justify-between gap-4 px-4 py-2',
        'hover:bg-surface-200 data-[state=open]:bg-surface-200',
        !canUseHoverActions && 'cursor-pointer',
        className
      )}
    >
      <span
        className={cn(
          'min-w-0 flex-1 font-sans text-sm leading-5 text-foreground-lighter',
          truncateLabel ? 'truncate' : 'break-all'
        )}
      >
        {label}
      </span>{' '}
      <span
        className={cn(
          'flex min-w-0 flex-[2] justify-end text-right text-sm leading-5',
          canUseHoverActions && 'group-hover/field:opacity-0 group-focus-within/field:opacity-0'
        )}
      >
        {children ?? value}
      </span>
      {canUseHoverActions && (
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center gap-0.5 pr-4 opacity-0',
            'focus-within:opacity-100 group-hover/field:opacity-100'
          )}
        >
          {filterActions.map(({ operator, apply }) => (
            <LogFieldRowAction
              key={operator}
              icon={OPERATOR_ICONS[operator] ?? FilterIcon}
              label={`Filter where ${label} ${LOGS_FILTER_OPERATOR_VERBS[operator]}`}
              onSelect={apply}
            />
          ))}
          <LogFieldRowAction
            icon={CopyIcon}
            label={`Copy ${label}`}
            onSelect={() => copyToClipboard(String(value))}
          />
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

function LogFieldRowAction({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: LucideIcon
  label: string
  onSelect: () => void
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onSelect()
  }

  return (
    <Tooltip delayDuration={0} disableHoverableContent>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          aria-label={label}
          onClick={handleClick}
          className={cn(
            'focus-ring flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm',
            'text-foreground-lighter hover:bg-selection hover:text-foreground'
          )}
        >
          <Icon size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" collisionPadding={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
