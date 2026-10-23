import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl } from './logs-endpoint'
import { quotedIdent, safeSql } from './safe-analytics-sql'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
  UnifiedLogsVariables,
  useUnifiedLogsBackend,
} from './unified-logs-infinite-query'
import {
  logsFiltersToUrlParams,
  parseLogsFilterUrlParams,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import { getFacetCountQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import {
  getEffectiveLogTypes,
  getFacetCountCTE,
  getUnifiedLogsCTE,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import { ResponseError, UseCustomQueryOptions } from '@/types'

type UnifiedLogsFacetCountVariables = UnifiedLogsVariables & {
  facet: string
  facetSearch?: string
  useOtel?: boolean
}

const facetRowsSchema = z.array(
  z.object({
    value: z.union([z.string(), z.number()]).transform(String),
    count: z
      .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
      .refine((count) => Number.isSafeInteger(count) && count >= 0),
  })
)

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
${getUnifiedLogsCTE(getEffectiveLogTypes(search))},
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
  if (data.error !== undefined) {
    throw new Error(typeof data.error === 'string' ? data.error : data.error.message)
  }
  return facetRowsSchema
    .parse(data.result)
    .sort((a, b) => b.count - a.count)
    .map((row) => ({
      label: row.value,
      value: row.value,
      count: row.count,
    }))
}

export type UnifiedLogsFacetCountData = Awaited<ReturnType<typeof getUnifiedLogsFacetCount>>
export type UnifiedLogsFacetCountError = ResponseError | z.ZodError

export const useUnifiedLogsFacetCountQuery = <TData = UnifiedLogsFacetCountData>(
  { projectRef, search, facet, facetSearch }: UnifiedLogsFacetCountVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData> = {}
) => {
  const useOtel = useUnifiedLogsBackend()
  const scopedSearch =
    facet === 'pathname'
      ? {
          ...search,
          filter: logsFiltersToUrlParams(
            parseLogsFilterUrlParams(search.filter).filter(({ column }) => column !== facet)
          ),
        }
      : search
  const facetScope = {
    ...scopedSearch,
    latency: null,
    'timing.dns': null,
    'timing.connection': null,
    'timing.tls': null,
    'timing.ttfb': null,
    'timing.transfer': null,
    sort: null,
    size: 40,
    start: 0,
    direction: 'next' as const,
    cursor: new Date(0),
    id: null,
  }
  return useQuery<UnifiedLogsFacetCountData, UnifiedLogsFacetCountError, TData>({
    queryKey: [
      ...logsKeys.unifiedLogsFacetCount(projectRef, facet, facetSearch, facetScope),
      { otel: useOtel },
    ],
    queryFn: ({ signal }) =>
      getUnifiedLogsFacetCount(
        { projectRef, search: facetScope, facet, facetSearch, useOtel },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
