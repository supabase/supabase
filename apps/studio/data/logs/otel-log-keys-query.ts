import { queryOptions, useQuery } from '@tanstack/react-query'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl } from './logs-endpoint'
import { analyticsLiteral, safeSql } from './safe-analytics-sql'

// `mapKeys` is the one operation that cannot avoid `log_attributes`: it reads
// the map itself, so the scan decompresses it for every row of the source in the
// window. Cost is therefore proportional to the window, and this query is only
// after the *names* a source uses — which are stable, not something a wider
// window discovers more of on a busy project.
//
// So start narrow and widen only when a window turns up nothing, which means the
// source was idle rather than that the keys are missing. A busy project answers
// from the first step; an idle one escalates, but its scans are small by
// definition. The last step preserves the original 7-day reach, so no project
// that resolved keys before stops resolving them now.
const LOOKBACK_HOURS_STEPS = [1, 24, 24 * 7] as const

const KEYS_STALE_TIME = 5 * 60 * 1000

async function fetchKeysForWindow({
  projectRef,
  source,
  lookbackHours,
  signal,
}: {
  projectRef: string
  source: string
  lookbackHours: number
  signal?: AbortSignal
}): Promise<string[]> {
  const end = new Date()
  const start = new Date(end.getTime() - lookbackHours * 60 * 60 * 1000)
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

export async function fetchOtelLogKeys({
  projectRef,
  source,
  signal,
}: {
  projectRef: string
  source: string
  signal?: AbortSignal
}): Promise<string[]> {
  for (const lookbackHours of LOOKBACK_HOURS_STEPS) {
    const keys = await fetchKeysForWindow({ projectRef, source, lookbackHours, signal })
    if (keys.length > 0) return keys
  }
  return []
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
