import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getLogsCountQuery } from 'components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { FacetMetadataSchema } from 'components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import { handleError, post } from 'data/fetchers'
import { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { logsKeys } from './keys'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
  UnifiedLogsVariables,
} from './unified-logs-infinite-query'

export async function getUnifiedLogsCount(
  { projectRef, search }: UnifiedLogsVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getUnifiedLogsCount')
  }

  const sql = getLogsCountQuery(search)
  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  const { data, error } = await post(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: { path: { ref: projectRef } },
    body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: isoTimestampEnd, sql },
    signal,
  })

  if (error) handleError(error)

  // Process count results into facets structure
  const facets: Record<string, FacetMetadataSchema> = {}
  const countsByDimension: Record<string, Map<string, number>> = {}
  let totalRowCount = 0

  // Group by dimension
  if (data?.result) {
    data.result.forEach((row: any) => {
      const dimension = row.dimension
      const value = row.value
      const count = Number(row.count || 0)

      // Set total count if this is the total dimension
      if (dimension === 'total' && value === 'all') {
        totalRowCount = count
      }

      // Initialize dimension map if not exists
      if (!countsByDimension[dimension]) {
        countsByDimension[dimension] = new Map()
      }

      // Add count to the dimension map
      countsByDimension[dimension].set(value, count)
    })
  }

  // Convert dimension maps to facets structure
  Object.entries(countsByDimension).forEach(([dimension, countsMap]) => {
    // Skip the 'total' dimension as it's not a facet
    if (dimension === 'total') return

    const dimensionTotal = Array.from(countsMap.values()).reduce((sum, count) => sum + count, 0)

    facets[dimension] = {
      total: dimensionTotal,
      rows: Array.from(countsMap.entries()).map(([value, count]) => ({ value, total: count })),
    }
  })

  return { totalRowCount, facets }
}

export type UnifiedLogsCountData = Awaited<ReturnType<typeof getUnifiedLogsCount>>
export type UnifiedLogsCountError = ExecuteSqlError

export const useUnifiedLogsCountQuery = <TData = UnifiedLogsCountData>(
  { projectRef, search }: UnifiedLogsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UnifiedLogsCountData, UnifiedLogsCountError, TData> = {}
) =>
  useQuery<UnifiedLogsCountData, UnifiedLogsCountError, TData>(
    logsKeys.unifiedLogsCount(projectRef, search),
    ({ signal }) => getUnifiedLogsCount({ projectRef, search }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
