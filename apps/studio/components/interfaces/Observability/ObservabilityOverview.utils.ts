import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useServiceStats } from '../HomeNew/ProjectUsageSection.utils'
import type { StatsLike } from '../HomeNew/ProjectUsageSection.utils'
import {
  sumTotal,
  sumWarnings,
  sumErrors,
  computeSuccessAndNonSuccessRates,
} from '../HomeNew/ProjectUsage.metrics'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import { usePostgrestOverviewMetrics, transformPostgrestMetrics } from './usePostgrestOverviewMetrics'

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

const transformServiceStats = (stats: StatsLike): ServiceHealthData => {
  const data = stats.eventChartData
  const total = sumTotal(data)
  const errorCount = sumErrors(data)
  const warningCount = sumWarnings(data)
  const okCount = total - errorCount - warningCount
  const errorRate = calculateErrorRate(data)
  const successRate = calculateSuccessRate(data)

  return {
    total,
    errorRate,
    successRate,
    errorCount,
    warningCount,
    okCount,
    eventChartData: data,
    isLoading: stats.isLoading,
    error: stats.error,
    refresh: stats.refresh,
  }
}

/**
 * Hook to fetch and transform observability overview data for all services
 */
export const useObservabilityOverviewData = (
  projectRef: string,
  interval: '1hr' | '1day' | '7day',
  refreshKey: number
): OverviewData => {
  const statsByService = useServiceStats(projectRef, interval)

  // refreshKey forces date recalculation when user clicks refresh button
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { startDate, endDate } = useMemo(() => {
    const now = dayjs()
    const end = now.toISOString()
    let start: string

    switch (interval) {
      case '1hr':
        start = now.subtract(1, 'hour').toISOString()
        break
      case '1day':
        start = now.subtract(1, 'day').toISOString()
        break
      case '7day':
        start = now.subtract(7, 'day').toISOString()
        break
      default:
        start = now.subtract(1, 'hour').toISOString()
    }

    return { startDate: start, endDate: end }
  }, [interval, refreshKey])

  const {
    data: postgrestData,
    isLoading: postgrestLoading,
    error: postgrestError,
    refetch: postgrestRefetch,
  } = usePostgrestOverviewMetrics({
    projectRef,
    startDate,
    endDate,
    interval,
  })

  const postgrestStats = useMemo((): ServiceHealthData => {
    const data = postgrestData ? transformPostgrestMetrics(postgrestData) : []
    const total = sumTotal(data)
    const errorCount = sumErrors(data)
    const warningCount = sumWarnings(data)
    const okCount = total - errorCount - warningCount
    const errorRate = calculateErrorRate(data)
    const successRate = calculateSuccessRate(data)

    return {
      total,
      errorRate,
      successRate,
      errorCount,
      warningCount,
      okCount,
      eventChartData: data,
      isLoading: postgrestLoading,
      error: postgrestError,
      refresh: postgrestRefetch,
    }
  }, [postgrestData, postgrestLoading, postgrestError, postgrestRefetch])

  const services: Record<ServiceKey, ServiceHealthData> = {
    db: transformServiceStats(statsByService.db.current),
    functions: transformServiceStats(statsByService.functions.current),
    auth: transformServiceStats(statsByService.auth.current),
    storage: transformServiceStats(statsByService.storage.current),
    realtime: transformServiceStats(statsByService.realtime.current),
    postgrest: postgrestStats,
  }

  const totalRequests = Object.values(services).reduce((sum, s) => sum + s.total, 0)
  const totalErrors = Object.values(services).reduce((sum, s) => sum + s.errorCount, 0)
  const totalWarnings = Object.values(services).reduce((sum, s) => sum + s.warningCount, 0)

  const { successRate: overallSuccessRate, nonSuccessRate: overallErrorRate } =
    computeSuccessAndNonSuccessRates(totalRequests, totalWarnings, totalErrors)

  const isLoading = Object.values(services).some((s) => s.isLoading)

  return {
    services,
    aggregated: {
      totalRequests,
      totalErrors,
      totalWarnings,
      overallErrorRate,
      overallSuccessRate,
    },
    isLoading,
  }
}
