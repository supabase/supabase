import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Skeleton } from 'ui'

import { hasLogOverviewRenderer, LogOverview } from '../ServiceFlow/LogOverview'
import { getLogDataForMetadataVisibility } from '../ServiceFlowPanel.utils'
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
}: {
  row: ColumnSchema
  tab: 'overview' | 'raw-json'
  searchParameters: QuerySearchParamsType
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
  const canFetchAttributes =
    isOtel && logsMetadata && !row.metadata && !hasLogOverviewRenderer(row.log_type)
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
        <div role="status" className="flex items-center gap-3 p-3 text-foreground-light">
          <Skeleton className="h-4 w-4 rounded-full" />
          <span className="text-sm">Enriching log...</span>
        </div>
      )}
      {tab === 'raw-json' && <RawJsonView data={rawData} copyLabel="Copy log as JSON" />}
      {tab === 'overview' && (
        <LogOverview
          attributes={attributes}
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
