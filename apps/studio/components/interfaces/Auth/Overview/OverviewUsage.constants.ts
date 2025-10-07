import dayjs from 'dayjs'
import { fetchLogs } from 'data/reports/report.utils'

// Date range helpers
export const getDateRanges = () => {
  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()
  const previousEndDate = dayjs().subtract(24, 'hour').toISOString()
  const previousStartDate = dayjs().subtract(48, 'hour').toISOString()

  return {
    current: { startDate, endDate },
    previous: { startDate: previousStartDate, endDate: previousEndDate },
  }
}

export const AUTH_COMBINED_QUERY = () => `
  WITH periods AS (
    SELECT 'current' AS period, 
           timestamp >= timestamp_sub(current_timestamp(), interval 24 hour) 
           AND timestamp < current_timestamp() AS in_period
    UNION ALL
    SELECT 'previous' AS period,
           timestamp >= timestamp_sub(current_timestamp(), interval 48 hour)
           AND timestamp < timestamp_sub(current_timestamp(), interval 24 hour) AS in_period
  ),
  base AS (
    SELECT
      CASE 
        WHEN timestamp >= timestamp_sub(current_timestamp(), interval 24 hour) THEN 'current'
        ELSE 'previous'
      END AS period,
      TIMESTAMP_TRUNC(timestamp, HOUR) AS ts_hour,
      JSON_VALUE(event_message, '$.auth_event.action') AS action,
      JSON_VALUE(event_message, '$.auth_event.actor_id') AS actor_id,
      CAST(JSON_VALUE(event_message, '$.duration') AS INT64) AS duration_ns
    FROM auth_logs
    WHERE timestamp >= timestamp_sub(current_timestamp(), interval 48 hour)
      AND timestamp < current_timestamp()
  ),
  agg AS (
    SELECT
      period,
      ts_hour,
      COUNT(DISTINCT CASE 
        WHEN action IN (
          'login','user_signedup','token_refreshed','user_modified',
          'user_recovery_requested','user_reauthenticate_requested'
        ) THEN actor_id 
        ELSE NULL 
      END) AS active_users,
      COUNT(CASE WHEN action = 'user_recovery_requested' THEN 1 ELSE NULL END) AS password_reset_requests,
      COUNT(CASE WHEN action = 'user_signedup' THEN 1 ELSE NULL END) AS signups,
      ROUND(AVG(CASE WHEN action = 'login' THEN duration_ns ELSE NULL END) / 1000000, 2) AS signin_avg_ms,
      ROUND(AVG(CASE WHEN action = 'user_signedup' THEN duration_ns ELSE NULL END) / 1000000, 2) AS signup_avg_ms
    FROM base
    GROUP BY period, ts_hour
  )
  
  SELECT period, ts_hour AS timestamp, 'activeUsers' AS metric, CAST(active_users AS FLOAT64) AS value
  FROM agg
  UNION ALL
  SELECT period, ts_hour, 'passwordResetRequests' AS metric, CAST(password_reset_requests AS FLOAT64)
  FROM agg
  UNION ALL
  SELECT period, ts_hour, 'signUpCount' AS metric, CAST(signups AS FLOAT64)
  FROM agg
  UNION ALL
  SELECT period, ts_hour, 'signInLatency' AS metric, COALESCE(signin_avg_ms, 0)
  FROM agg
  UNION ALL
  SELECT period, ts_hour, 'signUpLatency' AS metric, COALESCE(signup_avg_ms, 0)
  FROM agg
  ORDER BY timestamp DESC, period, metric
`

export const fetchAllAuthMetrics = async (projectRef: string) => {
  const sql = AUTH_COMBINED_QUERY()
  const startDate = dayjs().subtract(48, 'hour').toISOString()
  const endDate = dayjs().toISOString()

  return await fetchLogs(projectRef, sql, startDate, endDate)
}

export const processAllAuthMetrics = (data: any[]) => {
  if (!data || !Array.isArray(data)) {
    return {
      current: { activeUsers: 0, passwordResets: 0, signInLatency: 0, signUpLatency: 0 },
      previous: { activeUsers: 0, passwordResets: 0, signInLatency: 0, signUpLatency: 0 },
    }
  }

  const metrics = {
    current: { activeUsers: 0, passwordResets: 0, signInLatency: 0, signUpLatency: 0 },
    previous: { activeUsers: 0, passwordResets: 0, signInLatency: 0, signUpLatency: 0 },
  }

  // Group by period and metric
  const grouped = data.reduce(
    (acc, row) => {
      const { period, metric, value } = row
      if (!acc[period]) acc[period] = {}
      if (!acc[period][metric]) acc[period][metric] = []
      acc[period][metric].push(value || 0)
      return acc
    },
    {} as Record<string, Record<string, number[]>>
  )

  for (const period of ['current', 'previous'] as const) {
    if (grouped[period]) {
      metrics[period].activeUsers = (grouped[period].activeUsers || []).reduce(
        (sum: number, v: number) => sum + v,
        0
      )
      metrics[period].passwordResets = (grouped[period].passwordResetRequests || []).reduce(
        (sum: number, v: number) => sum + v,
        0
      )

      const signInValues = grouped[period].signInLatency || []
      metrics[period].signInLatency =
        signInValues.length > 0
          ? signInValues.reduce((sum: number, v: number) => sum + v, 0) / signInValues.length
          : 0

      const signUpValues = grouped[period].signUpLatency || []
      metrics[period].signUpLatency =
        signUpValues.length > 0
          ? signUpValues.reduce((sum: number, v: number) => sum + v, 0) / signUpValues.length
          : 0
    }
  }

  return metrics
}

// Utility functions
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getChangeColor = (percentageChange: number): string => {
  return percentageChange >= 0 ? 'text-brand' : 'text-destructive'
}

export const getChangeSign = (percentageChange: number): string => {
  return percentageChange >= 0 ? '+' : ''
}
