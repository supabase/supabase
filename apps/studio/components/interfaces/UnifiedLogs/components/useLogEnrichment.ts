import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'

import { ColumnSchema } from '../UnifiedLogs.schema'
import { QuerySearchParamsType } from '../UnifiedLogs.types'
import { getLogTypeSource, getRowTimestampMs } from '../UnifiedLogs.utils'
import { unifiedLogAttributesQueryOptions } from '@/data/logs/unified-log-attributes-query'
import {
  SERVICE_FLOW_TYPES,
  useUnifiedLogInspectionQuery,
} from '@/data/logs/unified-log-inspection-query'
import { useUnifiedLogsBackend } from '@/data/logs/unified-logs-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/**
 * Loads what a log row doesn't carry itself: its service flow and, when missing, its attributes.
 * With `shouldFetch: false` it only follows a fetch another caller started, so the panel header
 * can show progress without loading details for tabs that don't need them.
 */
export function useLogEnrichment({
  row,
  searchParameters,
  shouldFetch = true,
}: {
  row: ColumnSchema
  searchParameters: QuerySearchParamsType
  shouldFetch?: boolean
}) {
  const { ref: projectRef } = useParams()
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const isOtel = useUnifiedLogsBackend(searchParameters)
  const normalizedType = row.log_type === 'edge function' ? 'edge-function' : row.log_type
  const serviceFlowType = SERVICE_FLOW_TYPES.find((type) => type === normalizedType)
  const logTimestampMs = getRowTimestampMs(row)

  const inspection = useUnifiedLogInspectionQuery(
    { projectRef, logId: row.id, type: serviceFlowType, search: searchParameters, logTimestampMs },
    { enabled: shouldFetch && !!serviceFlowType }
  )

  const canFetchAttributes = isOtel && logsMetadata && !row.metadata
  const attributesQuery = unifiedLogAttributesQueryOptions({
    projectRef,
    logId: row.id,
    source: getLogTypeSource(row.log_type),
    logTimestampMs,
  })
  const fetchedAttributes = useQuery({
    ...attributesQuery,
    select: (row) => row?.log_attributes ?? null,
    enabled: shouldFetch && canFetchAttributes && attributesQuery.enabled,
  })

  return {
    enrichedData: inspection.data?.result?.[0],
    attributes: logsMetadata ? (row.metadata ?? fetchedAttributes.data) : undefined,
    isLoading: inspection.isLoading || fetchedAttributes.isLoading,
    error: inspection.error ?? fetchedAttributes.error,
  }
}
