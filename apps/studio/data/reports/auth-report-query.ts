import { useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'

function activeUsersSql(bucket: 'day' | 'week' | 'month', start: string, end: string) {
  return `
    select 
      timestamp_trunc(timestamp, ${bucket}) as timestamp,
      count(distinct json_value(f.event_message, "$.user_id")) as count
    from auth_logs f
    where json_value(f.event_message, "$.action") in (
      'login', 'user_signedup', 'token_refreshed', 'user_modified',
      'user_recovery_requested', 'user_reauthenticate_requested'
    )
      and timestamp >= '${start}'
      and timestamp <= '${end}'
    group by timestamp
    order by timestamp desc
  `
}

const metricSqlMap: Record<string, (start: string, end: string, interval: string) => string> = {
  DAU: (start, end, interval) => activeUsersSql('day', start, end),
  WAU: (start, end, interval) => activeUsersSql('week', start, end),
  MAU: (start, end, interval) => activeUsersSql('month', start, end),
}

export function useAuthReport({
  projectRef,
  metricKey,
  startDate,
  endDate,
  interval,
  enabled = true,
}: {
  projectRef: string
  metricKey: string
  startDate: string
  endDate: string
  interval: string
  enabled?: boolean
}) {
  const sql = metricSqlMap[metricKey]?.(startDate, endDate, interval)

  const _enabled = Boolean(projectRef && sql && enabled)

  const { data, error, isLoading } = useQuery(
    ['auth-metrics', projectRef, metricKey, startDate, endDate, interval, sql],
    async () => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            sql,
            project: projectRef,
            iso_timestamp_start: startDate,
            iso_timestamp_end: endDate,
          },
        },
      })
      if (error) throw error
      // Format result for chart: [{ period_start, [metricKey]: count }]
      const formatted = (data?.result || []).map((row: any) => ({
        period_start: row.timestamp,
        [metricKey]: row.count,
      }))
      return formatted
    },
    {
      enabled: _enabled,
      refetchOnWindowFocus: false,
    }
  )

  return {
    isLoading,
    error,
    data,
  }
}
