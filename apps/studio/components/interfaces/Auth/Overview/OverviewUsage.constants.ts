import { get } from 'data/fetchers'
import {
  RawAuthMetricsResponseSchema,
  type RawAuthMetricsResponse,
  type RawAuthMetricsRow,
} from './OverviewUsage.schema'

export type AuthMetricsResponse = RawAuthMetricsResponse

export type MetricName =
  | 'activeUsers'
  | 'signUpCount'
  | 'apiTotalRequests'
  | 'apiErrorRequests'
  | 'authTotalRequests'
  | 'authTotalErrors'
  | 'passwordResetRequests'

type NumericMetricKey = keyof Omit<RawAuthMetricsRow, 'period'>

const metricKeyMap: Record<MetricName, NumericMetricKey> = {
  activeUsers: 'active_users',
  signUpCount: 'sign_up_count',
  apiTotalRequests: 'api_total_requests',
  apiErrorRequests: 'api_error_requests',
  authTotalRequests: 'auth_total_requests',
  authTotalErrors: 'auth_total_errors',
  passwordResetRequests: 'password_reset_requests',
}

export const fetchAllAuthMetrics = async (projectRef: string): Promise<RawAuthMetricsResponse> => {
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

  const parsed = RawAuthMetricsResponseSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new Error(`Invalid auth metrics response: ${first?.message ?? 'Invalid shape'}`)
  }
  return parsed.data
}

export const getMetricValues = (
  metrics: AuthMetricsResponse | undefined,
  metricName: MetricName
) => {
  const key = metricKeyMap[metricName]
  const currentRow = metrics?.result.find((r) => r.period === 'current')
  const previousRow = metrics?.result.find((r) => r.period === 'previous')
  return {
    current: currentRow ? currentRow[key] : 0,
    previous: previousRow ? previousRow[key] : 0,
  }
}

export const getApiSuccessRates = (metrics: AuthMetricsResponse | undefined) => {
  const { current: apiTotalCurrent, previous: apiTotalPrevious } = getMetricValues(
    metrics,
    'apiTotalRequests'
  )
  const { current: apiErrorCurrent, previous: apiErrorPrevious } = getMetricValues(
    metrics,
    'apiErrorRequests'
  )
  const current =
    apiTotalCurrent > 0 ? Math.max(0, 100 - (apiErrorCurrent / apiTotalCurrent) * 100) : 0
  const previous =
    apiTotalPrevious > 0 ? Math.max(0, 100 - (apiErrorPrevious / apiTotalPrevious) * 100) : 0
  return { current, previous }
}

export const getAuthSuccessRates = (metrics: AuthMetricsResponse | undefined) => {
  const { current: authTotalRequestsCurrent, previous: authTotalRequestsPrevious } =
    getMetricValues(metrics, 'authTotalRequests')
  const { current: authTotalErrorsCurrent, previous: authTotalErrorsPrevious } = getMetricValues(
    metrics,
    'authTotalErrors'
  )
  const current =
    authTotalRequestsCurrent > 0
      ? Math.max(0, 100 - (authTotalErrorsCurrent / authTotalRequestsCurrent) * 100)
      : 0
  const previous =
    authTotalRequestsPrevious > 0
      ? Math.max(0, 100 - (authTotalErrorsPrevious / authTotalRequestsPrevious) * 100)
      : 0
  return { current, previous }
}

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getChangeColor = (percentageChange: number): string => {
  return percentageChange >= 0 ? 'text-brand' : 'text-destructive'
}
