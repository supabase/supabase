import { describe, expect, it } from 'vitest'

import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import {
  buildApiGatewayProductData,
  calculateApiGatewayAggregate,
} from './apiGatewayProductChart.utils'

const datum = (
  timestamp: string,
  ok_count: number,
  warning_count: number,
  error_count: number
): LogsBarChartDatum => ({ timestamp, ok_count, warning_count, error_count })

describe('buildApiGatewayProductData', () => {
  it('returns an empty array when there is no service data', () => {
    expect(buildApiGatewayProductData({})).toEqual([])
  })

  it('sums each product bucket total (infos + warnings + errors) per timestamp', () => {
    const result = buildApiGatewayProductData({
      db: { eventChartData: [datum('2024-01-01T00:00:00Z', 10, 1, 1)] },
      auth: { eventChartData: [datum('2024-01-01T00:00:00Z', 5, 0, 0)] },
    })

    expect(result).toHaveLength(1)
    expect(result[0].db).toBe(12)
    expect(result[0].auth).toBe(5)
    // Products not present in the input still default to zero
    expect(result[0].storage).toBe(0)
  })

  it('merges multiple timestamps and sorts them ascending', () => {
    const result = buildApiGatewayProductData({
      db: {
        eventChartData: [
          datum('2024-01-01T02:00:00Z', 3, 0, 0),
          datum('2024-01-01T01:00:00Z', 2, 0, 0),
        ],
      },
      storage: {
        eventChartData: [datum('2024-01-01T01:00:00Z', 1, 0, 0)],
      },
    })

    expect(result.map((r) => r.timestamp)).toEqual([
      '2024-01-01T01:00:00Z',
      '2024-01-01T02:00:00Z',
    ])
    expect(result[0].db).toBe(2)
    expect(result[0].storage).toBe(1)
    expect(result[1].db).toBe(3)
    expect(result[1].storage).toBe(0)
  })

  it('only includes the requested product keys', () => {
    const result = buildApiGatewayProductData(
      {
        db: { eventChartData: [datum('2024-01-01T00:00:00Z', 10, 0, 0)] },
        auth: { eventChartData: [datum('2024-01-01T00:00:00Z', 5, 0, 0)] },
      },
      ['db']
    )

    expect(result[0]).toEqual({ timestamp: '2024-01-01T00:00:00Z', db: 10 })
    expect(result[0]).not.toHaveProperty('auth')
  })
})

describe('calculateApiGatewayAggregate', () => {
  it('returns zeroed metrics when there is no service data', () => {
    expect(calculateApiGatewayAggregate({})).toEqual({
      total: 0,
      errorCount: 0,
      warningCount: 0,
      successRate: 0,
      errorRate: 0,
    })
  })

  it('sums totals across products and derives success and error rates', () => {
    const result = calculateApiGatewayAggregate({
      db: { total: 80, errorCount: 4, warningCount: 0 },
      auth: { total: 20, errorCount: 0, warningCount: 16 },
    })

    expect(result.total).toBe(100)
    expect(result.errorCount).toBe(4)
    expect(result.warningCount).toBe(16)
    // 4 errors / 100 total
    expect(result.errorRate).toBe(4)
    // 100 - ((16 warnings + 4 errors) / 100) * 100
    expect(result.successRate).toBe(80)
  })

  it('respects a custom product key list', () => {
    const result = calculateApiGatewayAggregate(
      {
        db: { total: 80, errorCount: 4, warningCount: 0 },
        auth: { total: 20, errorCount: 0, warningCount: 16 },
      },
      ['db']
    )

    expect(result.total).toBe(80)
    expect(result.errorCount).toBe(4)
  })
})
