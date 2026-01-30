import {
  computeSuccessAndNonSuccessRates,
  sumErrors,
  sumTotal,
  sumWarnings,
} from '../HomeNew/ProjectUsage.metrics'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import { useServiceHealthMetrics } from './useServiceHealthMetrics'

export type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime' | 'postgrest'

export type HealthStatus = 'healthy' | 'error' | 'unknown'

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
 * - Unknown: total_requests < 100 (insufficient data)
 * - Healthy: error_rate < 1%
 * - Unhealthy: error_rate ≥ 1%
 */
export const getHealthStatus = (
  errorRate: number,
  total: number
): { status: HealthStatus; color: string } => {
  if (total < 100) {
    return { status: 'unknown', color: 'muted' }
  }
  if (errorRate >= 1) {
    return { status: 'error', color: 'destructive' }
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
