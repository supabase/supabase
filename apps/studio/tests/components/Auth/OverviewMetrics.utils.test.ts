import { describe, expect, it } from 'vitest'

import {
  formatMetricChange,
  formatMetricValue,
} from '@/components/interfaces/Auth/Overview/OverviewMetrics.utils'

describe('formatMetricValue', () => {
  it.each(['', '%', 'ms'])('shows missing data without the %s suffix', (suffix) => {
    expect(formatMetricValue(null, suffix)).toBe('No data')
  })

  it.each([
    [0, '%', '0.0%'],
    [0.2, '%', '0.2%'],
    [99.96, '%', '100.0%'],
    [0, 'ms', '0.00ms'],
    [12.346, 'ms', '12.35ms'],
    [12.4, '', '12'],
    [12.6, '', '13'],
    [12.6, ' users', '13 users'],
  ])('formats %s with suffix %s as %s', (value, suffix, expected) => {
    expect(formatMetricValue(value, suffix)).toBe(expected)
  })

  it('uses locale separators for counts by default', () => {
    expect(formatMetricValue(12345.6)).toBe((12346).toLocaleString())
  })
})

describe('formatMetricChange', () => {
  it.each(['', '%', 'ms'])('omits missing changes with suffix %s', (suffix) => {
    expect(formatMetricChange(null, suffix)).toBeUndefined()
  })

  it.each([
    [0.2, '%', '0.2 pp'],
    [-0.2, '%', '-0.2 pp'],
    [12.36, '%', '12.4 pp'],
    [25, '', '25.0%'],
    [-25, 'ms', '-25.0%'],
    [0, '%', '0.0 pp'],
    [-0, '%', '0.0 pp'],
    [-0.01, '%', '0.0 pp'],
    [-0.01, '', '0.0%'],
  ])('formats change %s with suffix %s as %s', (change, suffix, expected) => {
    expect(formatMetricChange(change, suffix)).toBe(expected)
  })

  it('uses relative percentage changes by default', () => {
    expect(formatMetricChange(25)).toBe('25.0%')
  })
})
