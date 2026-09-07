import { Table } from '@tanstack/react-table'
import { Cable, ChevronDown, Clock, Database } from 'lucide-react'
import { memo } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { ColumnSchema } from '../../UnifiedLogs.schema'
import { getRowTimestampMs } from '../../UnifiedLogs.utils'
import { postgresDetailsFields, postgresPrimaryFields } from '../config/serviceFlowFields'
import { BlockFieldConfig } from '../types'
import { DetailRow } from './shared/DetailRow'
import { DetailSectionHeader } from './shared/DetailSection'
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
      config={config}
      level={data.level}
      value={value}
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
  const timestampMs = getRowTimestampMs(data)
  const formattedTime = timestampMs ? new Date(timestampMs).toLocaleString() : null

  const severity: string | undefined =
    enrichedData?.error_severity ??
    ((data as Record<string, unknown>)?.error_severity as string | undefined)

  return (
    <div>
      <DetailSectionHeader
        title="Request started"
        icon={Clock}
        summary={formattedTime ?? undefined}
      />

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full flex items-center justify-between pr-4 [&[data-state=open]>svg]:-rotate-180! transition hover:bg-surface-100">
          <DetailSectionHeader title="Postgres" icon={Database} />
          <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
        </CollapsibleTrigger>
        <CollapsibleContent className="[&>*:nth-child(odd)]:bg-surface-100/50">
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
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full flex items-center justify-between pr-4 [&[data-state=open]>svg]:-rotate-180! transition hover:bg-surface-100">
          <DetailSectionHeader title="Connection & Session Details" icon={Cable} />
          <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
        </CollapsibleTrigger>
        <CollapsibleContent className="[&>*:nth-child(odd)]:bg-surface-100/50">
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
        </CollapsibleContent>
      </Collapsible>

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
