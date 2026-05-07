import { describe, it, expect } from 'vitest'
import { isTimeMetric, formatTime } from './QueryInsightsChart.utils'

describe('isTimeMetric', () => {
  it('returns true for p50 and p95', () => {
    expect(isTimeMetric('p50')).toBe(true)
    expect(isTimeMetric('p95')).toBe(true)
  })

  it('returns false for other keys', () => {
    expect(isTimeMetric('calls')).toBe(false)
    expect(isTimeMetric('count')).toBe(false)
    expect(isTimeMetric('')).toBe(false)
    expect(isTimeMetric('P50')).toBe(false)
  })
})

describe('formatTime', () => {
  it('formats a timestamp into a human-readable date string', () => {
    const ts = new Date('2024-01-15T14:30:00Z').getTime()
    const result = formatTime(ts)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the month and day', () => {
    const ts = new Date('2024-06-01T10:00:00Z').getTime()
    const result = formatTime(ts)
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/1/)
  })
})
