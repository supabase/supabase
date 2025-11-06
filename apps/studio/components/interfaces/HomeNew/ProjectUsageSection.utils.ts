import { useProjectMetricsQuery } from 'data/analytics/project-metrics-query'
import type { ProjectMetricsByService } from 'data/analytics/project-metrics-query'

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
 * loading/error/refresh semantics per service.
 *
 * Why this exists
 * - The backend returns a flattened time-series grouped by service with
 *   separate "current" and "previous" windows. UI components expect a stable
 *   shape by service with metadata (isLoading, error, refresh) attached to
 *   each series. This adapter isolates that mapping and is easy to unit test.
 */
export const toServiceStatsMap = (args: {
  data?: ProjectMetricsByService
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

  const toStats = (rows: StatsLike['eventChartData'] | undefined): StatsLike =>
    rows ? { ...base, eventChartData: rows } : empty

  const pair = (key: ServiceKey): { current: StatsLike; previous: StatsLike } => ({
    current: toStats(data?.[key]?.current),
    previous: toStats(data?.[key]?.previous),
  })

  return {
    db: pair('db'),
    functions: pair('functions'),
    auth: pair('auth'),
    storage: pair('storage'),
    realtime: pair('realtime'),
  }
}

export const useServiceStats = (
  projectRef: string,
  interval: '1hr' | '1day' | '7day'
): ServiceStatsMap => {
  const { data, isLoading, error, refetch } = useProjectMetricsQuery({ projectRef, interval })

  return toServiceStatsMap({
    data,
    isLoading,
    error,
    onRefresh: () => {
      void refetch()
    },
  })
}
