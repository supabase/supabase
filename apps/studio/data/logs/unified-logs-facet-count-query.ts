import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl } from './logs-endpoint'
import { quotedIdent, safeSql } from './safe-analytics-sql'
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
import { ResponseError, UseCustomQueryOptions } from '@/types'

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
  const cteName = quotedIdent(facet.replaceAll('.', '_') + '_count')

  const sql = useOtel
    ? getFacetCountQuery({ search, facet, facetSearch })
    : safeSql`
${getUnifiedLogsCTE()},
${getFacetCountCTE({ search, facet, facetSearch, cteName })}
SELECT dimension, value, count from ${cteName};
`

  const endpoint = logsAllEndpointUrl(useOtel)
  const data = await executeAnalyticsSql({
    projectRef,
    endpoint,
    sql,
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
    signal,
  })
  return (data.result ?? []) as Option[]
}

export type UnifiedLogsFacetCountData = Awaited<ReturnType<typeof getUnifiedLogsFacetCount>>
export type UnifiedLogsFacetCountError = ResponseError

export const useUnifiedLogsFacetCountQuery = <TData = UnifiedLogsFacetCountData>(
  { projectRef, search, facet, facetSearch }: UnifiedLogsFacetCountVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData> = {}
) => {
  const useOtel = !!useFlag('otelUnifiedLogs')
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
