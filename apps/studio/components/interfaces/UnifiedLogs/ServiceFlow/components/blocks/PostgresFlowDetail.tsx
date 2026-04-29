import { Table } from '@tanstack/react-table'
import { ChevronRight, Clock, Database } from 'lucide-react'
import { memo, ReactNode } from 'react'

import { ColumnSchema } from '../../../UnifiedLogs.schema'
import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { postgresDetailsFields, postgresPrimaryFields } from '../../config/serviceFlowFields'
import { BlockFieldConfig } from '../../types'
import { DetailRow } from '../shared/DetailRow'
import { DetailSectionHeader } from '../shared/DetailSection'
import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

interface PostgresFlowDetailProps {
  data: ColumnSchema
  enrichedData?: Record<string, any>
  isLoading?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table: Table<any>
}

const renderFieldValue = (config: BlockFieldConfig, value: unknown): ReactNode => {
  if (value === null || value === undefined || value === '') return value as ReactNode

  if (config.id === 'status') {
    return (
      <DataTableColumnStatusCode
        value={value as string | number}
        level={getStatusLevel(value as string | number)}
        className="text-xs"
      />
    )
  }

  return value as ReactNode
}

const FieldDetailRow = ({
  config,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: {
  config: BlockFieldConfig
  data: ColumnSchema
  enrichedData?: Record<string, any>
  isLoading?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table: Table<any>
}) => {
  const value = config.getValue(data, enrichedData)
  const showSkeleton = !!config.requiresEnrichedData && !!isLoading && !value

  return (
    <DetailRow
      label={config.label}
      value={renderFieldValue(config, value)}
      filterId={config.id}
      filterValue={typeof value === 'string' || typeof value === 'number' ? value : undefined}
      filterFields={filterFields}
      table={table}
      isLoading={showSkeleton}
    />
  )
}

export const PostgresFlowDetail = memo(function PostgresFlowDetail({
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: PostgresFlowDetailProps) {
  const timestampMs = data?.timestamp
    ? data.timestamp / 1000
    : data?.date
      ? data.date.getTime()
      : null
  const formattedTime = timestampMs ? new Date(timestampMs).toLocaleString() : null

  const severity: string | undefined = enrichedData?.error_severity ?? (data as any)?.error_severity

  return (
    <div className="[&>*:nth-child(even)]:bg-surface-100/50">
      <DetailSectionHeader
        title="Requested started"
        icon={Clock}
        summary={formattedTime ?? undefined}
      />

      <DetailSectionHeader title="Postgres" icon={Database} />

      {postgresPrimaryFields.map((field) => (
        <FieldDetailRow
          key={field.id}
          config={field}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      ))}

      <DetailSectionHeader title="Connection & Session Details" icon={ChevronRight} />

      {postgresDetailsFields.map((field) => (
        <FieldDetailRow
          key={field.id}
          config={field}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      ))}

      <DetailSectionHeader
        title="Operation result"
        icon={Clock}
        summary={
          severity ? (
            <span className="font-mono text-sm uppercase text-foreground">{severity}</span>
          ) : undefined
        }
      />
    </div>
  )
})

PostgresFlowDetail.displayName = 'PostgresFlowDetail'
