import { Table } from '@tanstack/react-table'
import { ReactNode } from 'react'
import { cn, Skeleton } from 'ui'

import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableSheetRowAction } from '@/components/ui/DataTable/DataTableSheetRowAction'

interface DetailRowProps {
  label: string
  value: ReactNode
  /** When provided, the row becomes a click target that opens filter actions for this column. */
  filterId?: string
  /** Raw string used as the filter value when the row is filterable. Falls back to `value` if it's a primitive. */
  filterValue?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields?: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table?: Table<any>
  isLoading?: boolean
}

export const DetailRow = ({
  label,
  value,
  filterId,
  filterValue,
  filterFields,
  table,
  isLoading,
}: DetailRowProps) => {
  const isEmpty = value === null || value === undefined || value === ''

  const isFilterable =
    !!filterId &&
    !!filterFields?.some((f) => f.value === filterId) &&
    !!table &&
    !isLoading &&
    !isEmpty

  const resolvedFilterValue =
    filterValue ?? (typeof value === 'string' || typeof value === 'number' ? value : undefined)

  const labelEl = (
    <span className="truncate text-xs uppercase tracking-wide text-foreground-lighter">
      {label}
    </span>
  )

  const valueEl = isLoading ? (
    <Skeleton className="h-4 w-24" />
  ) : isEmpty ? (
    <span className="font-mono text-sm text-foreground-muted">—</span>
  ) : typeof value === 'string' || typeof value === 'number' ? (
    <span
      className={cn(
        'truncate text-right font-mono text-sm text-foreground',
        isFilterable && 'group-hover:underline'
      )}
    >
      {value}
    </span>
  ) : (
    value
  )

  const rowClass = 'flex items-center justify-between gap-3 px-4 py-1.5'

  if (isFilterable && resolvedFilterValue !== undefined) {
    return (
      <DataTableSheetRowAction
        fieldValue={filterId!}
        filterFields={filterFields!}
        value={resolvedFilterValue}
        table={table!}
        className={cn(rowClass, 'group w-full cursor-pointer hover:bg-surface-200/50')}
      >
        {labelEl}
        {valueEl}
      </DataTableSheetRowAction>
    )
  }

  return (
    <div className={rowClass}>
      {labelEl}
      {valueEl}
    </div>
  )
}
