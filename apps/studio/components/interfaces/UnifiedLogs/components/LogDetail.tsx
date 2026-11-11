import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import type { ReactNode } from 'react'
import { Skeleton } from 'ui'

import { LogOverview } from '../ServiceFlow/LogOverview'
import { getLogDataForMetadataVisibility } from '../ServiceFlowPanel.utils'
import { addLogsFilter, logAttributeFilterId } from '../UnifiedLogs.filters'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { QuerySearchParamsType } from '../UnifiedLogs.types'
import { getLogTypeSource, getRawLogData, getRowTimestampMs } from '../UnifiedLogs.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RawJsonView } from '@/components/ui/RawJsonView'
import { unifiedLogAttributesQueryOptions } from '@/data/logs/unified-log-attributes-query'
import {
  SERVICE_FLOW_TYPES,
  useUnifiedLogInspectionQuery,
} from '@/data/logs/unified-log-inspection-query'
import { useUnifiedLogsBackend } from '@/data/logs/unified-logs-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export function LogDetail({
  row,
  tab,
  searchParameters,
  overviewHeader,
}: {
  row: ColumnSchema
  tab: 'overview' | 'raw-json'
  searchParameters: QuerySearchParamsType
  overviewHeader?: ReactNode
}) {
  const { ref: projectRef } = useParams()
  const { table, filterFields } = useDataTable<ColumnSchema, unknown>()
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const normalizedType = row.log_type === 'edge function' ? 'edge-function' : row.log_type
  const serviceFlowType = SERVICE_FLOW_TYPES.find((type) => type === normalizedType)
  const { data, isPending, error } = useUnifiedLogInspectionQuery(
    {
      projectRef,
      logId: row.id,
      type: serviceFlowType,
      search: searchParameters,
      logTimestampMs: getRowTimestampMs(row),
    },
    { enabled: !!serviceFlowType }
  )
  const isOtel = useUnifiedLogsBackend(searchParameters)
  const canFetchAttributes = isOtel && logsMetadata && !row.metadata
  const attributesQuery = unifiedLogAttributesQueryOptions({
    projectRef,
    logId: row.id,
    source: getLogTypeSource(row.log_type),
    logTimestampMs: getRowTimestampMs(row),
  })
  const {
    data: fetchedAttributes,
    isLoading: isLoadingAttributes,
    error: attributesError,
  } = useQuery({
    ...attributesQuery,
    select: (row) => row?.log_attributes ?? null,
    enabled: canFetchAttributes && attributesQuery.enabled,
  })
  const attributes = logsMetadata ? (row.metadata ?? fetchedAttributes) : undefined

  const isLoading = (!!serviceFlowType && isPending) || isLoadingAttributes
  const retrievalError = error ?? attributesError
  const enrichedData = data?.result?.[0]
  const baseData = enrichedData ?? (attributes ? { ...row, metadata: attributes } : row)
  const rawData = getLogDataForMetadataVisibility(getRawLogData(baseData), logsMetadata)

  return (
    <div className="py-2">
      {retrievalError && (
        <AlertError
          error={retrievalError}
          subject="Failed to retrieve log details"
          projectRef={projectRef}
          className="mx-4 mb-2"
        />
      )}
      {isLoading && (
        <div role="status" className="flex h-10 items-center gap-2 px-4 text-foreground-light">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <span className="text-xs">Enriching log...</span>
        </div>
      )}
      {tab === 'raw-json' && <RawJsonView data={rawData} copyLabel="Copy log as JSON" />}
      {tab === 'overview' && (
        <LogOverview
          header={overviewHeader}
          attributes={attributes}
          onAddAttributeFilter={
            isOtel
              ? (key, value, operator) =>
                  addLogsFilter(table, { field: logAttributeFilterId(key), operator, value })
              : undefined
          }
          data={row}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      )}
    </div>
  )
}
