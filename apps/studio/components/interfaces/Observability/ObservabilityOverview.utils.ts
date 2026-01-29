import {
  computeSuccessAndNonSuccessRates,
  sumErrors,
  sumTotal,
  sumWarnings,
} from '../HomeNew/ProjectUsage.metrics'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import { useServiceHealthMetrics } from './useServiceHealthMetrics'

export type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime' | 'postgrest'

export type HealthStatus = 'healthy' | 'warning' | 'error' | 'no-data'

export type ServiceHealthData = {
  total: number
  errorRate: number
  successRate: number
  errorCount: number
  warningCount: number
  okCount: number
  eventChartData: LogsBarChartDatum[]
  isLoading: boolean
  error: unknown | null
  refresh: () => void
}

export type OverviewData = {
  services: Record<ServiceKey, ServiceHealthData>
  aggregated: {
    totalRequests: number
    totalErrors: number
    totalWarnings: number
    overallErrorRate: number
    overallSuccessRate: number
  }
  isLoading: boolean
}

export const calculateErrorRate = (data: LogsBarChartDatum[]): number => {
  const total = sumTotal(data)
  const errors = sumErrors(data)
  return total > 0 ? (errors / total) * 100 : 0
}

export const calculateSuccessRate = (data: LogsBarChartDatum[]): number => {
  const total = sumTotal(data)
  const warnings = sumWarnings(data)
  const errors = sumErrors(data)
  const { successRate } = computeSuccessAndNonSuccessRates(total, warnings, errors)
  return successRate
}

/**
 * Get health status and color based on error rate
 * - Green: error_rate < 5%
 * - Yellow: 5% ≤ error_rate < 15%
 * - Red: error_rate ≥ 15%
 * - Gray: No data (total_requests = 0)
 */
export const getHealthStatus = (
  errorRate: number,
  total: number
): { status: HealthStatus; color: string } => {
  if (total === 0) {
    return { status: 'no-data', color: 'muted' }
  }
  if (errorRate >= 15) {
    return { status: 'error', color: 'destructive' }
  }
  if (errorRate >= 5) {
    return { status: 'warning', color: 'warning' }
  }
  return { status: 'healthy', color: 'brand' }
}

/**
 * Hook to fetch and transform observability overview data for all services
 * Uses the same reliable query logic as the logs pages
 */
export const useObservabilityOverviewData = (
  projectRef: string,
  interval: '1hr' | '1day' | '7day',
  refreshKey: number
): OverviewData => {
  // The new hook handles all services using logs page logic
  return useServiceHealthMetrics(projectRef, interval, refreshKey)
}
