import { Table } from '@tanstack/react-table'
import { memo, ReactNode } from 'react'
import { Badge } from 'ui'

import { ColumnSchema } from '../../../UnifiedLogs.schema'
import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { postgresDetailsFields, postgresPrimaryFields } from '../../config/serviceFlowFields'
import { BlockFieldConfig } from '../../types'
import { DetailRow } from '../shared/DetailRow'
import { DetailSection } from '../shared/DetailSection'
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
  // Request started — timestamp summary
  const timestampMs = data?.timestamp
    ? data.timestamp / 1000
    : data?.date
      ? data.date.getTime()
      : null
  const formattedTime = timestampMs ? new Date(timestampMs).toLocaleString() : null

  // Operation result — postgres severity (LOG / ERROR / FATAL / etc.)
  const severity: string | undefined = enrichedData?.error_severity ?? (data as any)?.error_severity
  const eventMessage: string | undefined =
    enrichedData?.event_message ?? (data as any)?.event_message
  const isErrorSeverity = !!severity && ['error', 'fatal'].includes(severity.toLowerCase())

  return (
    <div className="divide-y divide-border border-t border-border">
      <DetailSection
        title="Request started"
        collapsible={false}
        summary={
          formattedTime ? (
            <span className="font-mono text-sm text-foreground">{formattedTime}</span>
          ) : null
        }
      />

      <DetailSection title="Postgres" defaultOpen>
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

        <DetailSection title="Connection & Session Details" defaultOpen={false}>
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
        </DetailSection>
      </DetailSection>

      <DetailSection
        title="Operation result"
        defaultOpen={!!eventMessage}
        collapsible={!!eventMessage}
        summary={
          severity ? (
            <Badge variant={isErrorSeverity ? 'destructive' : 'default'}>
              {severity.toUpperCase()}
            </Badge>
          ) : null
        }
      >
        {eventMessage ? (
          <div className="px-4 py-2">
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded border border-border bg-surface-100 p-3 font-mono text-xs leading-relaxed">
              {eventMessage}
            </div>
          </div>
        ) : null}
      </DetailSection>
    </div>
  )
})

PostgresFlowDetail.displayName = 'PostgresFlowDetail'
