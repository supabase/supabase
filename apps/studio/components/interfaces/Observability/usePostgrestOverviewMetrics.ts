import { useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { generateRegexpWhere } from '../Reports/Reports.constants'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'

type PostgrestMetricsVariables = {
  projectRef: string
  startDate: string
  endDate: string
  interval: '1hr' | '1day' | '7day'
}

const getIntervalTrunc = (interval: '1hr' | '1day' | '7day') => {
  switch (interval) {
    case '1hr':
      return 'minute' // 1-minute buckets for 1 hour
    case '1day':
      return 'hour' // 1-hour buckets for 1 day
    case '7day':
      return 'day' // 1-day buckets for 7 days
    default:
      return 'hour'
  }
}

const POSTGREST_METRICS_SQL = (interval: '1hr' | '1day' | '7day') => {
  const truncInterval = getIntervalTrunc(interval)

  return `
    -- postgrest-overview-metrics
    select
      cast(timestamp_trunc(t.timestamp, ${truncInterval}) as datetime) as timestamp,
      countif(response.status_code < 300) as ok_count,
      countif(response.status_code >= 300 and response.status_code < 400) as warning_count,
      countif(response.status_code >= 400) as error_count
    FROM edge_logs t
      cross join unnest(metadata) as m
      cross join unnest(m.response) as response
      cross join unnest(m.request) as request
    WHERE
      request.path like '/rest/%'
    GROUP BY
      timestamp
    ORDER BY
      timestamp ASC
  `
}

type MetricsRow = {
  timestamp: string
  ok_count: number
  warning_count: number
  error_count: number
}

async function fetchPostgrestMetrics(
  { projectRef, startDate, endDate, interval }: PostgrestMetricsVariables,
  signal?: AbortSignal
) {
  const sql = POSTGREST_METRICS_SQL(interval)

  const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: {
      path: { ref: projectRef },
      query: {
        sql,
        iso_timestamp_start: startDate,
        iso_timestamp_end: endDate,
      },
    },
    signal,
  })

  if (error || data?.error) {
    throw error || data?.error
  }

  return (data?.result || []) as MetricsRow[]
}

export const usePostgrestOverviewMetrics = (
  { projectRef, startDate, endDate, interval }: PostgrestMetricsVariables,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['postgrest-overview-metrics', projectRef, startDate, endDate, interval],
    queryFn: ({ signal }) =>
      fetchPostgrestMetrics({ projectRef, startDate, endDate, interval }, signal),
    enabled: (options?.enabled ?? true) && Boolean(projectRef),
    staleTime: 1000 * 60,
  })
}

export const transformPostgrestMetrics = (rows: MetricsRow[]): LogsBarChartDatum[] => {
  return rows.map((row) => ({
    timestamp: row.timestamp,
    ok_count: row.ok_count,
    warning_count: row.warning_count,
    error_count: row.error_count,
  }))
}
