import { Table } from '@tanstack/react-table'
import { ReactNode } from 'react'
import { cn, Skeleton } from 'ui'

import { LogFieldRow } from '../../../components/LogFieldRow'
import { type ColumnSchema } from '../../../UnifiedLogs.schema'
import { type BlockFieldConfig } from '../../types'
import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

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
  const resolvedValue = filterValue ?? value ?? ''
  const hasValue = value !== null && value !== undefined && value !== ''

  return (
    <LogFieldRow
      label={label}
      value={resolvedValue}
      fieldValue={hasValue ? filterId : undefined}
      filterFields={filterFields}
      table={table}
      disabled={isLoading}
      truncateLabel={!wrap}
      alignOffset={38}
      // Indent past the section header icon
      className="pl-[38px]"
    >
      {isLoading ? (
        <Skeleton className="my-0.5 h-4 w-24" />
      ) : (
        <FieldValue config={config} value={value} wrap={wrap} level={level ?? undefined} />
      )}
    </LogFieldRow>
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
    return <span className="font-mono text-sm leading-5 text-foreground-muted">—</span>
  }

  if (config.id === 'status') {
    return (
      <DataTableColumnStatusCode
        value={value as string | number}
        level={level}
        className="text-sm leading-5"
      />
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <span
        className={cn(
          'font-mono text-sm leading-5 text-foreground min-w-0',
          wrap ? 'break-all text-right' : 'truncate text-right'
        )}
      >
        {value}
      </span>
    )
  }

  return value as ReactNode
}
