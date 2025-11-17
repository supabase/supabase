import { Table } from '@tanstack/react-table'
import { HTMLAttributes, memo } from 'react'

import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'
import { DataTableSheetRowAction } from 'components/ui/DataTable/DataTableSheetRowAction'
import { cn, Skeleton } from 'ui'
import { SheetField } from '../UnifiedLogs.types'

interface SheetDetailsContentSkeletonProps<TData, TMeta> {
  fields: SheetField<TData, TMeta>[]
}

const SheetDetailsContentSkeleton = <TData, TMeta>({
  fields,
}: SheetDetailsContentSkeletonProps<TData, TMeta>) => {
  return (
    <dl className="divide-y">
      {fields.map((field) => (
        <div
          key={field.id.toString()}
          className="flex gap-4 py-2 text-sm justify-between items-center"
        >
          <dt className="shrink-0 text-muted-foreground">{field.label}</dt>
          <div>
            <Skeleton className={cn('h-5 w-52', field.skeletonClassName)} />
          </div>
        </div>
      ))}
    </dl>
  )
}

interface DataTableSheetContentProps<TData, TMeta> extends HTMLAttributes<HTMLDListElement> {
  data?: TData
  table: Table<TData>
  fields: SheetField<TData, TMeta>[]
  filterFields: DataTableFilterField<TData>[]
  metadata?: TMeta & {
    totalRows: number
    filterRows: number
    totalRowsFetched: number
  }
}

export function DataTableSheetContent<TData, TMeta>({
  data,
  table,
  className,
  fields,
  filterFields,
  metadata,
  ...props
}: DataTableSheetContentProps<TData, TMeta>) {
  if (!data) return <SheetDetailsContentSkeleton fields={fields} />

  return (
    <dl className={cn('divide-y', className)} {...props}>
      {fields.map((field) => {
        if (field.condition && !field.condition(data)) return null

        const Component = field.component
        const value = String(data[field.id])

        return (
          <div key={field.id.toString()}>
            {field.type === 'readonly' ? (
              <div
                className={cn(
                  'flex gap-4 my-1 py-1 text-sm justify-between items-center w-full',
                  field.className
                )}
              >
                <dt className="shrink-0 text-muted-foreground">{field.label}</dt>
                <dd className="font-mono w-full text-right truncate">
                  {Component ? <Component {...data} metadata={metadata} /> : value}
                </dd>
              </div>
            ) : (
              <DataTableSheetRowAction
                fieldValue={field.id}
                filterFields={filterFields}
                value={value}
                table={table}
                className={cn(
                  'flex gap-4 my-1 py-1 text-sm justify-between items-center w-full',
                  field.className
                )}
              >
                <dt className="shrink-0 text-muted-foreground">{field.label}</dt>
                <dd className="font-mono w-full text-right truncate">
                  {Component ? <Component {...data} metadata={metadata} /> : value}
                </dd>
              </DataTableSheetRowAction>
            )}
          </div>
        )
      })}
    </dl>
  )
}

export const MemoizedDataTableSheetContent = memo(DataTableSheetContent, (prev, next) => {
  // REMINDER: only check if data is the same, rest is useless
  return prev.data === next.data
}) as typeof DataTableSheetContent
