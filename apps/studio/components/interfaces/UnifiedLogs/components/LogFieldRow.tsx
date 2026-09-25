import type { Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { cn } from 'ui'

import type { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableSheetRowAction } from '@/components/ui/DataTable/DataTableSheetRowAction'

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
  alignOffset?: number
  className?: string
}

/** Key/value row for a log field, opening copy and filter actions on click. */
export function LogFieldRow<TData>({
  label,
  value,
  children,
  fieldValue,
  filterFields,
  table,
  disabled,
  truncateLabel = false,
  alignOffset = 16,
  className,
}: LogFieldRowProps<TData>) {
  return (
    <DataTableSheetRowAction
      fieldValue={fieldValue}
      filterFields={filterFields}
      table={table}
      value={value}
      label={label}
      disabled={disabled}
      className="rounded-none"
      alignOffset={alignOffset}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-start justify-between gap-4 px-4 py-2',
          'hover:bg-surface-200 data-[state=open]:bg-surface-200',
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
        <span className="flex min-w-0 flex-[2] justify-end text-right text-sm leading-5">
          {children ?? value}
        </span>
      </div>
    </DataTableSheetRowAction>
  )
}
