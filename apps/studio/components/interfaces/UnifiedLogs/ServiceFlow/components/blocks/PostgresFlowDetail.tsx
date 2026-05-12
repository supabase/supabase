import { Table } from '@tanstack/react-table'
import { Cable, Clock, Database } from 'lucide-react'
import { memo } from 'react'

import { ColumnSchema } from '../../../UnifiedLogs.schema'
import { postgresDetailsFields, postgresPrimaryFields } from '../../config/serviceFlowFields'
import { BlockFieldConfig } from '../../types'
import { DetailRow } from '../shared/DetailRow'
import { DetailSectionHeader } from '../shared/DetailSection'
import { FieldValue } from '../shared/FieldValue'
import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'

interface PostgresFlowDetailProps {
  data: ColumnSchema
  enrichedData?: Record<string, any>
  isLoading?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table: Table<any>
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
      value={<FieldValue config={config} value={value} wrap={config.wrap} />}
      filterId={config.id}
      filterValue={typeof value === 'string' || typeof value === 'number' ? value : undefined}
      filterFields={filterFields}
      table={table}
      isLoading={showSkeleton}
      wrap={config.wrap}
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

  const severity: string | undefined =
    enrichedData?.error_severity ??
    ((data as Record<string, unknown>)?.error_severity as string | undefined)

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

      <DetailSectionHeader title="Connection & Session Details" icon={Cable} />

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
        topDivider
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
