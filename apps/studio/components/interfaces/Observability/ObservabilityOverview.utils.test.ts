import { describe, expect, it } from 'vitest'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import {
  calculateErrorRate,
  calculateSuccessRate,
  getHealthStatus,
} from './ObservabilityOverview.utils'

describe('calculateErrorRate', () => {
  it('returns 0 when total is 0', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 0, warning_count: 0, error_count: 0 },
    ]

    expect(calculateErrorRate(data)).toBe(0)
  })

  it('calculates correct error rate', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 80, warning_count: 10, error_count: 10 },
    ]

    expect(calculateErrorRate(data)).toBe(10)
  })

  it('calculates error rate across multiple data points', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 50, warning_count: 25, error_count: 25 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 50, warning_count: 25, error_count: 25 },
    ]

    expect(calculateErrorRate(data)).toBe(25)
  })

  it('handles high error rates', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 10, warning_count: 10, error_count: 80 },
    ]

    expect(calculateErrorRate(data)).toBe(80)
  })

  it('handles empty array', () => {
    expect(calculateErrorRate([])).toBe(0)
  })
})

describe('calculateSuccessRate', () => {
  it('returns 0 when total is 0', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 0, warning_count: 0, error_count: 0 },
    ]

    expect(calculateSuccessRate(data)).toBe(0)
  })

  it('calculates correct success rate', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 80, warning_count: 10, error_count: 10 },
    ]

    expect(calculateSuccessRate(data)).toBe(80)
  })

  it('returns 100% for all successful requests', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 100, warning_count: 0, error_count: 0 },
    ]

    expect(calculateSuccessRate(data)).toBe(100)
  })

  it('calculates success rate across multiple data points', () => {
    const data: LogsBarChartDatum[] = [
      { timestamp: '2024-01-15T12:00:00Z', ok_count: 70, warning_count: 15, error_count: 15 },
      { timestamp: '2024-01-15T12:01:00Z', ok_count: 70, warning_count: 15, error_count: 15 },
    ]

    expect(calculateSuccessRate(data)).toBe(70)
  })

  it('handles empty array', () => {
    expect(calculateSuccessRate([])).toBe(0)
  })
})

describe('getHealthStatus', () => {
  describe('no-data status', () => {
    it('returns no-data when total is 0', () => {
      const result = getHealthStatus(0, 0)

      expect(result).toEqual({
        status: 'no-data',
        color: 'muted',
      })
    })

    it('returns no-data even with error rate when total is 0', () => {
      const result = getHealthStatus(100, 0)

      expect(result).toEqual({
        status: 'no-data',
        color: 'muted',
      })
    })
  })

  describe('error status', () => {
    it('returns error when error rate is exactly 15%', () => {
      const result = getHealthStatus(15, 100)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })

    it('returns error when error rate is above 15%', () => {
      const result = getHealthStatus(20, 100)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })

    it('returns error for very high error rates', () => {
      const result = getHealthStatus(90, 100)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })
  })

  describe('warning status', () => {
    it('returns warning when error rate is exactly 5%', () => {
      const result = getHealthStatus(5, 100)

      expect(result).toEqual({
        status: 'warning',
        color: 'warning',
      })
    })

    it('returns warning when error rate is between 5% and 15%', () => {
      const result = getHealthStatus(10, 100)

      expect(result).toEqual({
        status: 'warning',
        color: 'warning',
      })
    })

    it('returns warning when error rate is just below 15%', () => {
      const result = getHealthStatus(14.9, 100)

      expect(result).toEqual({
        status: 'warning',
        color: 'warning',
      })
    })
  })

  describe('healthy status', () => {
    it('returns healthy when error rate is 0%', () => {
      const result = getHealthStatus(0, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns healthy when error rate is below 5%', () => {
      const result = getHealthStatus(2, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns healthy when error rate is just below 5%', () => {
      const result = getHealthStatus(4.9, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })
  })

  describe('edge cases', () => {
    it('handles fractional error rates correctly', () => {
      const result = getHealthStatus(4.99, 1000)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('handles very small total values', () => {
      const result = getHealthStatus(10, 1)

      expect(result).toEqual({
        status: 'warning',
        color: 'warning',
      })
    })

    it('handles very large total values', () => {
      const result = getHealthStatus(3, 1000000)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })
  })
})
