import { Table } from '@tanstack/react-table'
import { ReactNode } from 'react'
import { cn, Skeleton } from 'ui'

import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableSheetRowAction } from '@/components/ui/DataTable/DataTableSheetRowAction'

interface DetailRowProps {
  label: string
  value: ReactNode
  filterId?: string
  filterValue?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields?: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table?: Table<any>
  isLoading?: boolean
  wrap?: boolean
}

export const DetailRow = ({
  label,
  value,
  filterId,
  filterValue,
  filterFields,
  table,
  isLoading,
  wrap,
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
    <span
      className={cn(
        'flex items-center gap-2 text-xs uppercase tracking-wide text-foreground-lighter',
        wrap ? 'shrink-0' : 'min-w-0 truncate'
      )}
    >
      <span
        aria-hidden
        className="select-none font-mono text-foreground-muted translate-y-0.5 ml-5"
      >
        └
      </span>
      <span className={cn('font-mono', !wrap && 'truncate')}>{label}</span>
    </span>
  )

  const valueEl = isLoading ? (
    <Skeleton className="h-4 w-24" />
  ) : isEmpty ? (
    <span className="font-mono text-xs text-foreground-muted">—</span>
  ) : typeof value === 'string' || typeof value === 'number' ? (
    <span
      className={cn(
        'font-mono text-xs text-foreground',
        wrap ? 'break-all text-right max-w-[calc(100%-12rem)]' : 'truncate text-right',
        isFilterable && 'group-hover:underline'
      )}
    >
      {value}
    </span>
  ) : (
    value
  )

  const rowClass = cn(
    'flex items-start justify-between gap-3 px-4',
    wrap ? 'min-h-9 py-2' : 'h-9 items-center'
  )

  const isStringValue = typeof value === 'string' || typeof value === 'number'

  if (isFilterable && resolvedFilterValue !== undefined && isStringValue) {
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
      {isFilterable && resolvedFilterValue !== undefined && !isStringValue ? (
        <DataTableSheetRowAction
          fieldValue={filterId!}
          filterFields={filterFields!}
          value={resolvedFilterValue}
          table={table!}
          className="group"
        >
          <span className="[&_div]:group-hover:text-foreground">{valueEl}</span>
        </DataTableSheetRowAction>
      ) : (
        valueEl
      )}
    </div>
  )
}
