import type { ProjectMetricsRow } from 'data/analytics/project-metrics-query'
import { useProjectMetricsQuery } from 'data/analytics/project-metrics-query'

type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'

export type StatsLike = {
  error: unknown | null
  isLoading: boolean
  eventChartData: Array<{
    timestamp: string
    ok_count: number
    warning_count: number
    error_count: number
  }>
  refresh: () => void
}

type ServiceStatsMap = Record<
  ServiceKey,
  {
    current: StatsLike
    previous: StatsLike
  }
>

/**
 * Transform backend project metrics into a UI-friendly structure with consistent
 * loading/error/refresh state per service.
 *
 * Why this exists
 *  - Backend returns flat rows: one record per (time_window, service, bucket_ts).
 *  - UI needs per-service objects with two series (current/previous) to drive 5 cards and compute per-service totals.
 *  - Charts expect ISO string timestamps; backend gives TIMESTAMP (coming to client as microseconds). We convert to ISO.
 *  - We also need stable sorting and consistent empty arrays when a series has no points.
 *  - We attach loading/error/refresh per service to keep UI simple.
 */
export const toServiceStatsMap = (args: {
  data?: ProjectMetricsRow[]
  isLoading: boolean
  error?: unknown
  onRefresh: () => void
}): ServiceStatsMap => {
  const { data, isLoading, error, onRefresh } = args

  const base = {
    error: error ?? null,
    isLoading,
    refresh: () => {
      onRefresh()
    },
  }

  const empty: StatsLike = { ...base, eventChartData: [] }

  const grouped: Record<
    ServiceKey,
    { current: StatsLike['eventChartData']; previous: StatsLike['eventChartData'] }
  > = {
    db: { current: [], previous: [] },
    functions: { current: [], previous: [] },
    auth: { current: [], previous: [] },
    storage: { current: [], previous: [] },
    realtime: { current: [], previous: [] },
  }

  const toIso = (microseconds: number) => new Date(microseconds / 1000).toISOString()

  for (const r of data ?? []) {
    const bucket = grouped[r.service as ServiceKey]
    const target = r.time_window === 'current' ? bucket.current : bucket.previous
    target.push({
      timestamp: toIso(r.timestamp),
      ok_count: r.ok_count,
      warning_count: r.warning_count,
      error_count: r.error_count,
    })
  }

  const byTime = (a: { timestamp: string }, b: { timestamp: string }) =>
    Date.parse(a.timestamp) - Date.parse(b.timestamp)
  for (const key of Object.keys(grouped) as ServiceKey[]) {
    grouped[key].current.sort(byTime)
    grouped[key].previous.sort(byTime)
  }

  const toStats = (rows: StatsLike['eventChartData'] | undefined): StatsLike =>
    rows ? { ...base, eventChartData: rows } : empty

  return {
    db: { current: toStats(grouped.db.current), previous: toStats(grouped.db.previous) },
    functions: {
      current: toStats(grouped.functions.current),
      previous: toStats(grouped.functions.previous),
    },
    auth: { current: toStats(grouped.auth.current), previous: toStats(grouped.auth.previous) },
    storage: {
      current: toStats(grouped.storage.current),
      previous: toStats(grouped.storage.previous),
    },
    realtime: {
      current: toStats(grouped.realtime.current),
      previous: toStats(grouped.realtime.previous),
    },
  }
}

export const useServiceStats = (
  projectRef: string,
  interval: '1hr' | '1day' | '7day'
): ServiceStatsMap => {
  const {
    data,
    isPending: isLoading,
    error,
    refetch,
  } = useProjectMetricsQuery({ projectRef, interval })

  return toServiceStatsMap({
    data,
    isLoading,
    error,
    onRefresh: () => {
      void refetch()
    },
  })
}
