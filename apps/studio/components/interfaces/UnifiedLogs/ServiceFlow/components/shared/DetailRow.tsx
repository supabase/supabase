import { Table } from '@tanstack/react-table'
import { Filter, MoreVertical } from 'lucide-react'
import { ReactNode } from 'react'
import { Button, cn, Skeleton } from 'ui'

import { type ColumnSchema } from '../../../UnifiedLogs.schema'
import { type BlockFieldConfig } from '../../types'
import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { DataTableSheetRowAction } from '@/components/ui/DataTable/DataTableSheetRowAction'

interface DetailRowProps {
  config: BlockFieldConfig
  value: string | number | null | undefined
  level: ColumnSchema['level']
  filterValue?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table?: Table<any>
  isLoading?: boolean
}

export const DetailRow = ({
  config,
  value,
  level,

  filterValue,
  filterFields,
  table,
  isLoading,
}: DetailRowProps) => {
  const { id: filterId, label, wrap } = config
  const isFilterable =
    !!filterId && !!filterFields?.some((f) => f.value === filterId) && !!table && !isLoading
  const resolvedFilterValue = filterValue ?? undefined

  const isEmpty = value === null || value === undefined || value === ''

  const labelEl = (
    <span
      className={cn(
        'flex items-center gap-2 text-xs uppercase tracking-wide text-foreground-lighter',
        wrap ? 'shrink-0' : 'min-w-0 truncate'
      )}
    >
      <span className={cn('font-mono', !wrap && 'truncate')}>{label}</span>
    </span>
  )

  const valueEl = isLoading ? (
    <Skeleton className="h-4 w-24" />
  ) : (
    <FieldValue config={config} value={value} wrap={config.wrap} level={level} />
  )

  const rowClass = cn(
    'flex items-start justify-between items-center gap-x-10 px-4',
    wrap ? 'min-h-9 py-0' : 'h-9'
  )

  return (
    <div className={cn(rowClass, 'rounded-none group w-full')}>
      <div className="flex items-center gap-x-2 pl-[22px]">
        {labelEl}
        {isFilterable && resolvedFilterValue !== undefined && (
          <Filter size={12} className="text-foreground-lighter" />
        )}
      </div>
      <div className={cn('flex items-center gap-x-2', isEmpty && 'pr-2')}>
        {valueEl}
        {!isEmpty && (
          <DataTableSheetRowAction
            fieldValue={filterId}
            filterFields={filterFields}
            value={resolvedFilterValue ?? ''}
            table={table!}
            label={label}
          >
            <Button type="text" className="px-1" icon={<MoreVertical />} />
          </DataTableSheetRowAction>
        )}
      </div>
    </div>
  )
}

interface FieldValueProps {
  config: BlockFieldConfig
  value: unknown
  wrap?: boolean
  level?: string
}

const FieldValue = ({ config, value, wrap, level }: FieldValueProps): ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="font-mono text-xs text-foreground-muted">—</span>
  }

  if (config.id === 'status') {
    return (
      <DataTableColumnStatusCode
        value={value as string | number}
        level={level}
        className="text-xs"
      />
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <span
        className={cn(
          'font-mono text-xs text-foreground',
          wrap ? 'break-all text-right' : 'truncate text-right'
        )}
      >
        {value}
      </span>
    )
  }

  return value as ReactNode
}
