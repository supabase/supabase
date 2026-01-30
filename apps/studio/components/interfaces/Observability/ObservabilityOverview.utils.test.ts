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
  describe('unknown status', () => {
    it('returns unknown when total is 0', () => {
      const result = getHealthStatus(0, 0)

      expect(result).toEqual({
        status: 'unknown',
        color: 'muted',
      })
    })

    it('returns unknown when total is below 100', () => {
      const result = getHealthStatus(5, 50)

      expect(result).toEqual({
        status: 'unknown',
        color: 'muted',
      })
    })

    it('returns unknown when total is exactly 99', () => {
      const result = getHealthStatus(10, 99)

      expect(result).toEqual({
        status: 'unknown',
        color: 'muted',
      })
    })

    it('returns unknown even with high error rate when total is low', () => {
      const result = getHealthStatus(50, 20)

      expect(result).toEqual({
        status: 'unknown',
        color: 'muted',
      })
    })
  })

  describe('error status', () => {
    it('returns error when error rate is exactly 1%', () => {
      const result = getHealthStatus(1, 100)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })

    it('returns error when error rate is above 1%', () => {
      const result = getHealthStatus(5, 100)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })

    it('returns error when error rate is 10%', () => {
      const result = getHealthStatus(10, 200)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })

    it('returns error for very high error rates', () => {
      const result = getHealthStatus(90, 1000)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })
  })

  describe('healthy status', () => {
    it('returns healthy when error rate is 0% with sufficient data', () => {
      const result = getHealthStatus(0, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns healthy when error rate is below 1%', () => {
      const result = getHealthStatus(0.5, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns healthy when error rate is just below 1%', () => {
      const result = getHealthStatus(0.99, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns healthy with 0% error rate and large total', () => {
      const result = getHealthStatus(0, 10000)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })
  })

  describe('edge cases', () => {
    it('handles fractional error rates correctly', () => {
      const result = getHealthStatus(0.99, 1000)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns unknown for very small total values', () => {
      const result = getHealthStatus(10, 1)

      expect(result).toEqual({
        status: 'unknown',
        color: 'muted',
      })
    })

    it('handles very large total values', () => {
      const result = getHealthStatus(0.5, 1000000)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns healthy when total is exactly 100 and error rate is 0', () => {
      const result = getHealthStatus(0, 100)

      expect(result).toEqual({
        status: 'healthy',
        color: 'brand',
      })
    })

    it('returns error when total is exactly 100 and error rate is 1%', () => {
      const result = getHealthStatus(1, 100)

      expect(result).toEqual({
        status: 'error',
        color: 'destructive',
      })
    })
  })
})
