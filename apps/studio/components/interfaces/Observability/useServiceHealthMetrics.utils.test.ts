import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import {
  calculateAggregatedMetrics,
  calculateDateRange,
  calculateHealthMetrics,
  transformToBarChartData,
} from './useServiceHealthMetrics.utils'

describe('calculateDateRange', () => {
  beforeEach(() => {
    // Mock the current time to ensure consistent test results
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates correct date range for 1hr interval', () => {
    const result = calculateDateRange('1hr')

    expect(result.startDate).toBe('2024-01-15T11:00:00.000Z')
    expect(result.endDate).toBe('2024-01-15T12:00:00.000Z')
  })

  it('calculates correct date range for 1day interval', () => {
    const result = calculateDateRange('1day')

    expect(result.startDate).toBe('2024-01-14T12:00:00.000Z')
    expect(result.endDate).toBe('2024-01-15T12:00:00.000Z')
  })

  it('calculates correct date range for 7day interval', () => {
    const result = calculateDateRange('7day')

    expect(result.startDate).toBe('2024-01-08T12:00:00.000Z')
    expect(result.endDate).toBe('2024-01-15T12:00:00.000Z')
  })

  it('returns ISO format strings', () => {
    const result = calculateDateRange('1hr')

    expect(dayjs(result.startDate).isValid()).toBe(true)
    expect(dayjs(result.endDate).isValid()).toBe(true)
  })

  it('end date is always after start date', () => {
    const intervals: Array<'1hr' | '1day' | '7day'> = ['1hr', '1day', '7day']

    intervals.forEach((interval) => {
      const result = calculateDateRange(interval)
      expect(dayjs(result.endDate).isAfter(dayjs(result.startDate))).toBe(true)
    })
  })
})

describe('transformToBarChartData', () => {
  it('transforms raw data to LogsBarChartDatum format', () => {
    const rawData = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 10, warning_count: 2, error_count: 1 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 15, warning_count: 0, error_count: 0 },
    ]

    const result = transformToBarChartData(rawData)

    expect(result).toEqual([
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 10, warning_count: 2, error_count: 1 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 15, warning_count: 0, error_count: 0 },
    ])
  })

  it('handles missing count fields by setting them to 0', () => {
    const rawData = [
      { timestamp: '2024-01-15T12:00:00Z' },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 5 },
    ]

    const result = transformToBarChartData(rawData)

    expect(result).toEqual([
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 0, warning_count: 0, error_count: 0 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 5, warning_count: 0, error_count: 0 },
    ])
  })

  it('handles null values by converting to 0', () => {
    const rawData = [
      {
        timestamp: '2024-01-15T12:00:00Z',
        ok_count: null,
        warning_count: null,
        error_count: null,
      },
    ]

    const result = transformToBarChartData(rawData)

    expect(result).toEqual([
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 0, warning_count: 0, error_count: 0 },
    ])
  })

  it('handles empty array', () => {
    const result = transformToBarChartData([])

    expect(result).toEqual([])
  })

  it('preserves timestamp values', () => {
    const rawData = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 10, warning_count: 0, error_count: 0 },
    ]

    const result = transformToBarChartData(rawData)

    expect(result[0].timestamp).toBe('2024-01-15T12:00:00Z')
  })
})

describe('calculateHealthMetrics', () => {
  it('calculates metrics correctly with only ok requests', () => {
    const eventChartData: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 100, warning_count: 0, error_count: 0 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 50, warning_count: 0, error_count: 0 },
    ]

    const result = calculateHealthMetrics(eventChartData)

    expect(result).toEqual({
      total: 150,
      errorRate: 0,
      successRate: 100,
      errorCount: 0,
      warningCount: 0,
      okCount: 150,
    })
  })

  it('calculates metrics correctly with errors', () => {
    const eventChartData: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 80, warning_count: 10, error_count: 10 },
    ]

    const result = calculateHealthMetrics(eventChartData)

    expect(result).toEqual({
      total: 100,
      errorRate: 10,
      successRate: 80,
      errorCount: 10,
      warningCount: 10,
      okCount: 80,
    })
  })

  it('calculates metrics correctly with warnings', () => {
    const eventChartData: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 70, warning_count: 30, error_count: 0 },
    ]

    const result = calculateHealthMetrics(eventChartData)

    expect(result).toEqual({
      total: 100,
      errorRate: 0,
      successRate: 70,
      errorCount: 0,
      warningCount: 30,
      okCount: 70,
    })
  })

  it('returns 0 error rate when total is 0', () => {
    const eventChartData: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 0, warning_count: 0, error_count: 0 },
    ]

    const result = calculateHealthMetrics(eventChartData)

    expect(result).toEqual({
      total: 0,
      errorRate: 0,
      successRate: 0,
      errorCount: 0,
      warningCount: 0,
      okCount: 0,
    })
  })

  it('handles empty array', () => {
    const result = calculateHealthMetrics([])

    expect(result).toEqual({
      total: 0,
      errorRate: 0,
      successRate: 0,
      errorCount: 0,
      warningCount: 0,
      okCount: 0,
    })
  })

  it('aggregates metrics across multiple time periods', () => {
    const eventChartData: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 50, warning_count: 5, error_count: 5 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 30, warning_count: 5, error_count: 5 },
      { timestamp: '2024-01-15T12:02:00Z', ok_count: 20, warning_count: 0, error_count: 0 },
    ]

    const result = calculateHealthMetrics(eventChartData)

    expect(result).toEqual({
      total: 120,
      errorRate: (10 / 120) * 100,
      successRate: (100 / 120) * 100,
      errorCount: 10,
      warningCount: 10,
      okCount: 100,
    })
  })

  it('calculates correct error rate for high error scenario', () => {
    const eventChartData: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 10, warning_count: 10, error_count: 80 },
    ]

    const result = calculateHealthMetrics(eventChartData)

    expect(result.errorRate).toBe(80)
    expect(result.successRate).toBe(10)
  })
})

describe('calculateAggregatedMetrics', () => {
  it('aggregates metrics from multiple services', () => {
    const services = [
      { total: 100, errorCount: 10, warningCount: 5 },
      { total: 200, errorCount: 20, warningCount: 10 },
      { total: 50, errorCount: 5, warningCount: 2 },
    ]

    const result = calculateAggregatedMetrics(services)

    expect(result).toEqual({
      totalRequests: 350,
      totalErrors: 35,
      totalWarnings: 17,
      overallErrorRate: ((35 + 17) / 350) * 100,
      overallSuccessRate: ((350 - 35 - 17) / 350) * 100,
    })
  })

  it('handles empty services array', () => {
    const result = calculateAggregatedMetrics([])

    expect(result).toEqual({
      totalRequests: 0,
      totalErrors: 0,
      totalWarnings: 0,
      overallErrorRate: 0,
      overallSuccessRate: 0,
    })
  })

  it('handles single service', () => {
    const services = [{ total: 100, errorCount: 10, warningCount: 5 }]

    const result = calculateAggregatedMetrics(services)

    expect(result).toEqual({
      totalRequests: 100,
      totalErrors: 10,
      totalWarnings: 5,
      overallErrorRate: 15,
      overallSuccessRate: 85,
    })
  })

  it('handles services with zero metrics', () => {
    const services = [
      { total: 0, errorCount: 0, warningCount: 0 },
      { total: 100, errorCount: 10, warningCount: 5 },
    ]

    const result = calculateAggregatedMetrics(services)

    expect(result).toEqual({
      totalRequests: 100,
      totalErrors: 10,
      totalWarnings: 5,
      overallErrorRate: 15,
      overallSuccessRate: 85,
    })
  })

  it('calculates correct rates when all requests are successful', () => {
    const services = [
      { total: 100, errorCount: 0, warningCount: 0 },
      { total: 200, errorCount: 0, warningCount: 0 },
    ]

    const result = calculateAggregatedMetrics(services)

    expect(result).toEqual({
      totalRequests: 300,
      totalErrors: 0,
      totalWarnings: 0,
      overallErrorRate: 0,
      overallSuccessRate: 100,
    })
  })

  it('calculates correct rates when all requests fail', () => {
    const services = [
      { total: 100, errorCount: 100, warningCount: 0 },
      { total: 200, errorCount: 200, warningCount: 0 },
    ]

    const result = calculateAggregatedMetrics(services)

    expect(result).toEqual({
      totalRequests: 300,
      totalErrors: 300,
      totalWarnings: 0,
      overallErrorRate: 100,
      overallSuccessRate: 0,
    })
  })

  it('handles mixed success/warning/error scenarios', () => {
    const services = [
      { total: 100, errorCount: 20, warningCount: 30 }, // 50% success
      { total: 100, errorCount: 10, warningCount: 10 }, // 80% success
      { total: 100, errorCount: 0, warningCount: 0 }, // 100% success
    ]

    const result = calculateAggregatedMetrics(services)

    expect(result.totalRequests).toBe(300)
    expect(result.totalErrors).toBe(30)
    expect(result.totalWarnings).toBe(40)
    // Overall: 230 success, 40 warnings, 30 errors out of 300
    expect(result.overallSuccessRate).toBeCloseTo((230 / 300) * 100, 2)
    expect(result.overallErrorRate).toBeCloseTo((70 / 300) * 100, 2)
  })
})
