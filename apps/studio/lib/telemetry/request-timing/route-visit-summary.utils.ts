import type { RouteRequestsEvaluatedEvent } from 'common/telemetry-constants'

type Properties = RouteRequestsEvaluatedEvent['properties']

/** Endpoints and query labels reported per visit. The rest are folded into an "other" count. */
export const MAX_GROUPS_PER_VISIT = 25

export interface RequestRecord {
  /** Method and OpenAPI path template, e.g. `GET /platform/projects/{ref}` */
  endpoint: string
  /** `performance.now()` when the request was sent */
  startMs: number
  /** `performance.now()` when response headers arrived, or the request failed */
  endMs: number
  isError: boolean
}

export interface QueryRecord {
  label: string
  durationMs: number
  isError: boolean
  isBackgroundRefetch: boolean
}

export interface MutationRecord {
  durationMs: number
  isError: boolean
}

interface GroupStats {
  count: number
  errorCount: number
  totalMs: number
  maxMs: number
}

function groupByKey<T extends { isError: boolean }>(
  records: T[],
  getKey: (record: T) => string,
  getDurationMs: (record: T) => number
) {
  const groups = new Map<string, GroupStats>()

  for (const record of records) {
    const key = getKey(record)
    const durationMs = getDurationMs(record)
    const group = groups.get(key) ?? { count: 0, errorCount: 0, totalMs: 0, maxMs: 0 }

    group.count += 1
    if (record.isError) group.errorCount += 1
    group.totalMs += durationMs
    group.maxMs = Math.max(group.maxMs, durationMs)
    groups.set(key, group)
  }

  // Busiest first; ties broken by key so the output is deterministic
  const sorted = [...groups.entries()].sort(
    ([keyA, a], [keyB, b]) => b.totalMs - a.totalMs || keyA.localeCompare(keyB)
  )
  const kept = sorted.slice(0, MAX_GROUPS_PER_VISIT)
  const overflow = sorted.slice(MAX_GROUPS_PER_VISIT)

  return {
    kept: kept.map(([key, stats]) => ({
      key,
      count: stats.count,
      errorCount: stats.errorCount,
      totalMs: Math.round(stats.totalMs),
      maxMs: Math.round(stats.maxMs),
    })),
    overflowCount: overflow.reduce((sum, [, stats]) => sum + stats.count, 0),
  }
}

/**
 * Sweeps request start/end points in time order to find how much of the visit had requests in
 * flight, and how much of that had only one. A request that ends exactly when another starts
 * does not overlap it.
 */
function measureOverlap(records: RequestRecord[]) {
  const points = records
    .flatMap((record) => [
      { time: record.startMs, change: 1 },
      { time: record.endMs, change: -1 },
    ])
    .sort((a, b) => a.time - b.time || a.change - b.change)

  let inFlight = 0
  let maxConcurrent = 0
  let busyMs = 0
  let singleFlightMs = 0
  let previousTime = points[0]?.time ?? 0

  for (const point of points) {
    const elapsed = point.time - previousTime
    if (inFlight >= 1) busyMs += elapsed
    if (inFlight === 1) singleFlightMs += elapsed

    inFlight += point.change
    maxConcurrent = Math.max(maxConcurrent, inFlight)
    previousTime = point.time
  }

  return { busyMs, singleFlightMs, maxConcurrent }
}

export function summarizeRequests(
  records: RequestRecord[]
): Pick<
  Properties,
  | 'requestCount'
  | 'requestErrorCount'
  | 'requestSumMs'
  | 'requestBusyMs'
  | 'requestSpanMs'
  | 'maxConcurrentRequests'
  | 'singleFlightMs'
  | 'endpoints'
  | 'otherEndpointRequestCount'
> {
  const { busyMs, singleFlightMs, maxConcurrent } = measureOverlap(records)
  const groups = groupByKey(
    records,
    (record) => record.endpoint,
    (record) => record.endMs - record.startMs
  )

  const firstStartMs = Math.min(...records.map((record) => record.startMs))
  const lastEndMs = Math.max(...records.map((record) => record.endMs))

  return {
    requestCount: records.length,
    requestErrorCount: records.filter((record) => record.isError).length,
    requestSumMs: Math.round(
      records.reduce((sum, record) => sum + (record.endMs - record.startMs), 0)
    ),
    requestBusyMs: Math.round(busyMs),
    requestSpanMs: records.length > 0 ? Math.round(lastEndMs - firstStartMs) : 0,
    // A request with no duration never overlaps anything but was still in flight
    maxConcurrentRequests: records.length > 0 ? Math.max(maxConcurrent, 1) : 0,
    singleFlightMs: Math.round(singleFlightMs),
    endpoints: groups.kept.map(({ key, ...stats }) => ({ endpoint: key, ...stats })),
    otherEndpointRequestCount: groups.overflowCount,
  }
}

export function summarizeQueries(
  records: QueryRecord[]
): Pick<
  Properties,
  | 'queryFetchCount'
  | 'queryErrorCount'
  | 'queryBackgroundRefetchCount'
  | 'querySumMs'
  | 'queries'
  | 'otherQueryFetchCount'
> {
  const groups = groupByKey(
    records,
    (record) => record.label,
    (record) => record.durationMs
  )

  return {
    queryFetchCount: records.length,
    queryErrorCount: records.filter((record) => record.isError).length,
    queryBackgroundRefetchCount: records.filter((record) => record.isBackgroundRefetch).length,
    querySumMs: Math.round(records.reduce((sum, record) => sum + record.durationMs, 0)),
    queries: groups.kept.map(({ key, ...stats }) => ({ label: key, ...stats })),
    otherQueryFetchCount: groups.overflowCount,
  }
}

export function summarizeMutations(
  records: MutationRecord[]
): Pick<Properties, 'mutationCount' | 'mutationErrorCount' | 'mutationSumMs'> {
  return {
    mutationCount: records.length,
    mutationErrorCount: records.filter((record) => record.isError).length,
    mutationSumMs: Math.round(records.reduce((sum, record) => sum + record.durationMs, 0)),
  }
}
