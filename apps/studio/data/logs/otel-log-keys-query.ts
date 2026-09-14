import { queryOptions, useQuery } from '@tanstack/react-query'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl } from './logs-endpoint'
import { analyticsLiteral, safeSql } from './safe-analytics-sql'

const LOOKBACK_HOURS = 24 * 7

const KEYS_STALE_TIME = 5 * 60 * 1000

export async function fetchOtelLogKeys({
  projectRef,
  source,
  signal,
}: {
  projectRef: string
  source: string
  signal?: AbortSignal
}): Promise<string[]> {
  const end = new Date()
  const start = new Date(end.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000)
  const sql = safeSql`SELECT arrayJoin(mapKeys(log_attributes)) AS key, count() AS n FROM logs WHERE source = ${analyticsLiteral(source)} GROUP BY key ORDER BY n DESC LIMIT 500`
  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(true),
    sql,
    iso_timestamp_start: start.toISOString(),
    iso_timestamp_end: end.toISOString(),
    method: 'post',
    signal,
  })
  const rows = (data?.result ?? []) as { key: string }[]
  return rows.map((r) => r.key).filter(Boolean)
}

/**
 * Shared by the reactive hook and imperative `queryClient.fetchQuery` callers, so
 * a lookup triggered on submit reuses whatever a subscribed component already
 * cached for the same source (and vice versa).
 */
export function otelLogKeysQueryOptions({
  projectRef,
  source,
}: {
  projectRef: string
  source: string
}) {
  return queryOptions({
    queryKey: logsKeys.otelLogKeys(projectRef, source),
    queryFn: ({ signal }) => fetchOtelLogKeys({ projectRef, source, signal }),
    staleTime: KEYS_STALE_TIME,
  })
}

export function useOtelLogKeysQuery(
  { projectRef, source }: { projectRef?: string; source?: string },
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    ...otelLogKeysQueryOptions({ projectRef: projectRef ?? '', source: source ?? '' }),
    enabled: enabled && Boolean(projectRef) && Boolean(source),
  })
}
