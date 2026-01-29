import { describe, expect, it } from 'vitest'
import { normalizeCpuUsageDataPoints } from 'data/analytics/normalize-cpu-usage'
import type { DataPoint } from 'data/analytics/constants'

describe('normalizeCpuUsageDataPoints', () => {
  it('returns original values when total is within limit', () => {
    const data: DataPoint[] = [
      {
        period_start: '2024-01-01',
        cpu_usage_busy_system: 20,
        cpu_usage_busy_user: 30,
      },
    ]

    const result = normalizeCpuUsageDataPoints(data, [
      'cpu_usage_busy_system',
      'cpu_usage_busy_user',
    ])

    expect(result).toEqual(data)
  })

  it('normalizes values to 100 when total exceeds limit', () => {
    const data: DataPoint[] = [
      {
        period_start: '2024-01-01',
        cpu_usage_busy_system: 200,
        cpu_usage_busy_user: 100,
      },
    ]

    const result = normalizeCpuUsageDataPoints(data, [
      'cpu_usage_busy_system',
      'cpu_usage_busy_user',
    ])

    const total = Number(result[0].cpu_usage_busy_system) + Number(result[0].cpu_usage_busy_user)
    expect(total).toBeCloseTo(100, 6)
    expect(result[0].cpu_usage_busy_system).toBeCloseTo(66.6667, 3)
    expect(result[0].cpu_usage_busy_user).toBeCloseTo(33.3333, 3)
  })

  it('keeps non-cpu attributes unchanged', () => {
    const data: DataPoint[] = [
      {
        period_start: '2024-01-01',
        cpu_usage_busy_system: 200,
        cpu_usage_busy_user: 100,
        other_metric: 42,
      },
    ]

    const result = normalizeCpuUsageDataPoints(data, [
      'cpu_usage_busy_system',
      'cpu_usage_busy_user',
    ])

    expect(result[0].other_metric).toBe(42)
  })
})
