import type { Filters } from 'components/interfaces/Settings/Logs/Logs.types'
import { useProjectMetricsQuery } from 'data/analytics/project-metrics-query'

type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'

export type StatsLike = {
  error: string | Object | null
  isLoading: boolean
  filters: Filters
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

export const useServiceStats = (
  projectRef: string,
  timestampStart: string,
  timestampEnd: string,
  previousStart: string,
  previousEnd: string
): ServiceStatsMap => {
  const durationMs = new Date(timestampEnd).getTime() - new Date(timestampStart).getTime()
  const interval: '1hr' | '1day' | '7day' =
    durationMs <= 60 * 60 * 1000 ? '1hr' : durationMs <= 24 * 60 * 60 * 1000 ? '1day' : '7day'

  const { data, isLoading, refetch } = useProjectMetricsQuery({
    projectRef,
    isoTimestampStart: timestampStart,
    isoTimestampEnd: timestampEnd,
    interval,
  })

  const makeStatsLike = (arr: StatsLike['eventChartData']): StatsLike => ({
    error: null,
    isLoading,
    filters: {} as Filters,
    eventChartData: arr,
    refresh: () => {
      void refetch()
    },
  })

  const empty: StatsLike = makeStatsLike([])

  return {
    db: {
      current: data ? makeStatsLike(data.db.current) : empty,
      previous: data ? makeStatsLike(data.db.previous) : empty,
    },
    functions: {
      current: data ? makeStatsLike(data.functions.current) : empty,
      previous: data ? makeStatsLike(data.functions.previous) : empty,
    },
    auth: {
      current: data ? makeStatsLike(data.auth.current) : empty,
      previous: data ? makeStatsLike(data.auth.previous) : empty,
    },
    storage: {
      current: data ? makeStatsLike(data.storage.current) : empty,
      previous: data ? makeStatsLike(data.storage.previous) : empty,
    },
    realtime: {
      current: data ? makeStatsLike(data.realtime.current) : empty,
      previous: data ? makeStatsLike(data.realtime.previous) : empty,
    },
  }
}
