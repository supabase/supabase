import dayjs from 'dayjs'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import {
  computeSuccessAndNonSuccessRates,
  sumErrors,
  sumTotal,
  sumWarnings,
} from '../HomeNew/ProjectUsage.metrics'

/**
 * Calculates the date range for fetching service health metrics
 * based on the selected interval
 */
export const calculateDateRange = (
  interval: '1hr' | '1day' | '7day'
): { startDate: string; endDate: string } => {
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
}

export type RawChartData = {
  timestamp: string | number
  ok_count?: number | null
  warning_count?: number | null
  error_count?: number | null
  [key: string]: string | number | null | undefined
}

/**
 * Transforms raw chart query results to LogsBarChartDatum format
 */
export const transformToBarChartData = (data: RawChartData[]): LogsBarChartDatum[] => {
  return data.map((row) => ({
    timestamp: typeof row.timestamp === 'string' ? row.timestamp : String(row.timestamp),
    ok_count: row.ok_count ?? 0,
    warning_count: row.warning_count ?? 0,
    error_count: row.error_count ?? 0,
  }))
}

/**
 * Calculates health metrics from bar chart data
 */
export const calculateHealthMetrics = (eventChartData: LogsBarChartDatum[]) => {
  const total = sumTotal(eventChartData)
  const errorCount = sumErrors(eventChartData)
  const warningCount = sumWarnings(eventChartData)
  const okCount = total - errorCount - warningCount
  const errorRate = total > 0 ? (errorCount / total) * 100 : 0
  const { successRate } = computeSuccessAndNonSuccessRates(total, warningCount, errorCount)

  return {
    total,
    errorRate,
    successRate,
    errorCount,
    warningCount,
    okCount,
  }
}

/**
 * Calculates aggregated metrics across all services
 */
export const calculateAggregatedMetrics = (
  services: {
    total: number
    errorCount: number
    warningCount: number
  }[]
) => {
  const totalRequests = services.reduce((sum, s) => sum + s.total, 0)
  const totalErrors = services.reduce((sum, s) => sum + s.errorCount, 0)
  const totalWarnings = services.reduce((sum, s) => sum + s.warningCount, 0)

  const { successRate: overallSuccessRate, nonSuccessRate: overallErrorRate } =
    computeSuccessAndNonSuccessRates(totalRequests, totalWarnings, totalErrors)

  return {
    totalRequests,
    totalErrors,
    totalWarnings,
    overallErrorRate,
    overallSuccessRate,
  }
}
