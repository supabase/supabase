import { get } from 'data/fetchers'

export type AuthMetric = {
  metric:
    | 'activeUsers'
    | 'signUpCount'
    | 'apiTotalRequests'
    | 'apiErrorRequests'
    | 'authTotalRequests'
    | 'authTotalErrors'
    | 'passwordResetRequests'
  current_value: number | null
  previous_value: number | null
}

export type AuthMetricsResponse = {
  result: AuthMetric[]
  error: unknown
}

export const fetchAllAuthMetrics = async (projectRef: string) => {
  const { data, error } = await get(
    `/platform/projects/{ref}/analytics/endpoints/auth.metrics` as any,
    {
      params: {
        path: { ref: projectRef },
        query: {
          interval: '1day',
        },
      },
    }
  )
  if (error) throw error
  return data as AuthMetricsResponse
}

export const getMetricValues = (
  metrics: AuthMetricsResponse | undefined,
  metricName: AuthMetric['metric']
) => {
  const metric = metrics?.result.find((m) => m.metric === metricName)
  return {
    current: metric?.current_value ?? 0,
    previous: metric?.previous_value ?? 0,
  }
}

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getChangeColor = (percentageChange: number): string => {
  return percentageChange >= 0 ? 'text-brand' : 'text-destructive'
}
