import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import {
  getFacetCountCTE,
  getUnifiedLogsCTE,
} from 'components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { Option } from 'components/ui/DataTable/DataTable.types'
import { handleError, post } from 'data/fetchers'
import { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { logsKeys } from './keys'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
  UnifiedLogsVariables,
} from './unified-logs-infinite-query'

type UnifiedLogsFacetCountVariables = UnifiedLogsVariables & {
  facet: string
  facetSearch?: string
}

export async function getUnifiedLogsFacetCount(
  { projectRef, search, facet, facetSearch }: UnifiedLogsFacetCountVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getUnifiedLogsFacetCount')
  }

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)
  const sql = `
${getUnifiedLogsCTE()},
${getFacetCountCTE({ search, facet, facetSearch })}
SELECT dimension, value, count from ${facet}_count;
`.trim()
  const { data, error } = await post(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: { path: { ref: projectRef } },
    body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: isoTimestampEnd, sql },
    signal,
  })

  if (error) handleError(error)
  return (data.result ?? []) as Option[]
}

export type UnifiedLogsFacetCountData = Awaited<ReturnType<typeof getUnifiedLogsFacetCount>>
export type UnifiedLogsFacetCountError = ExecuteSqlError

export const useUnifiedLogsFacetCountQuery = <TData = UnifiedLogsFacetCountData>(
  { projectRef, search, facet, facetSearch }: UnifiedLogsFacetCountVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData> = {}
) =>
  useQuery<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData>(
    logsKeys.unifiedLogsFacetCount(projectRef, facet, facetSearch, search),
    ({ signal }) => getUnifiedLogsFacetCount({ projectRef, search, facet, facetSearch }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
