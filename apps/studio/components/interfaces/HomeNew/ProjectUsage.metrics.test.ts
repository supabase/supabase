import { describe, it, expect } from 'vitest'
import {
  computeSuccessAndNonSuccessRates,
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
})
