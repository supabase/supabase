import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { logsKeys } from './keys'
import { logsAllEndpointUrl } from './logs-endpoint'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
  UnifiedLogsVariables,
} from './unified-logs-infinite-query'
import { getFacetCountQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import {
  getFacetCountCTE,
  getUnifiedLogsCTE,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import { Option } from '@/components/ui/DataTable/DataTable.types'
import { handleError, post } from '@/data/fetchers'
import { ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

type UnifiedLogsFacetCountVariables = UnifiedLogsVariables & {
  facet: string
  facetSearch?: string
  useOtel?: boolean
}

export async function getUnifiedLogsFacetCount(
  { projectRef, search, facet, facetSearch, useOtel = false }: UnifiedLogsFacetCountVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getUnifiedLogsFacetCount')
  }

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)
  const sql = useOtel
    ? getFacetCountQuery({ search, facet, facetSearch })
    : `
${getUnifiedLogsCTE()},
${getFacetCountCTE({ search, facet, facetSearch })}
SELECT dimension, value, count from ${facet}_count;
`.trim()

  const endpoint = logsAllEndpointUrl(useOtel)
  const { data, error } = await post(endpoint, {
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
  }: UseCustomQueryOptions<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData> = {}
) => {
  const useOtel = useFlag('otelUnifiedLogs')
  return useQuery<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData>({
    queryKey: [
      ...logsKeys.unifiedLogsFacetCount(projectRef, facet, facetSearch, search),
      { otel: useOtel },
    ],
    queryFn: ({ signal }) =>
      getUnifiedLogsFacetCount({ projectRef, search, facet, facetSearch, useOtel }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
