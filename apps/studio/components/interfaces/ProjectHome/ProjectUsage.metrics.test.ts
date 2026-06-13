import { describe, expect, it } from 'vitest'

import {
  computeChangePercent,
  computeSuccessAndNonSuccessRates,
  formatDelta,
  sumErrors,
  sumTotal,
  sumWarnings,
  toLogsBarChartData,
} from './ProjectUsage.metrics'

describe('ProjectUsage.metrics', () => {
  const rows = [
    { timestamp: '2025-10-22T13:00:00Z', ok_count: 90, warning_count: 5, error_count: 5 },
    { timestamp: '2025-10-22T13:01:00Z', ok_count: 50, warning_count: 10, error_count: 0 },
  ]

  it('toLogsBarChartData maps and coerces fields correctly', () => {
    const data = toLogsBarChartData(rows)
    expect(data).toHaveLength(2)
    expect(data[0]).toEqual({
      timestamp: '2025-10-22T13:00:00Z',
      ok_count: 90,
      warning_count: 5,
      error_count: 5,
    })
  })

  it('sum helpers compute totals correctly', () => {
    const data = toLogsBarChartData(rows)
    expect(sumTotal(data)).toBe(160)
    expect(sumWarnings(data)).toBe(15)
    expect(sumErrors(data)).toBe(5)
  })

  it('computeSuccessAndNonSuccessRates returns expected percentages', () => {
    const data = toLogsBarChartData(rows)
    const total = sumTotal(data)
    const warns = sumWarnings(data)
    const errs = sumErrors(data)
    const { successRate, nonSuccessRate } = computeSuccessAndNonSuccessRates(total, warns, errs)

    // success = 160 - (15 + 5) = 140 → 87.5%
    expect(successRate).toBeCloseTo(87.5)
    expect(nonSuccessRate).toBeCloseTo(12.5)
  })

  describe('computeChangePercent', () => {
    it('returns 0 when both current and previous are 0', () => {
      expect(computeChangePercent(0, 0)).toBe(0)
    })

    it('returns 100 when previous is 0 and current is positive', () => {
      expect(computeChangePercent(50, 0)).toBe(100)
    })

    it('returns positive percent for growth', () => {
      expect(computeChangePercent(150, 100)).toBe(50)
    })

    it('returns negative percent for decline', () => {
      expect(computeChangePercent(80, 100)).toBe(-20)
    })

    it('returns 0 when current equals previous', () => {
      expect(computeChangePercent(100, 100)).toBe(0)
    })
  })

  describe('formatDelta', () => {
    it('prefixes positive values with +', () => {
      expect(formatDelta(12.345)).toBe('+12.3%')
    })

    it('keeps the minus sign for negative values', () => {
      expect(formatDelta(-4.2)).toBe('-4.2%')
    })

    it('treats 0 as positive (with + sign)', () => {
      expect(formatDelta(0)).toBe('+0.0%')
    })
  })
})
