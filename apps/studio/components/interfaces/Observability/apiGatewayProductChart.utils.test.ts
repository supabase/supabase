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

    expect(result.map((r) => r.timestamp)).toEqual(['2024-01-01T01:00:00Z', '2024-01-01T02:00:00Z'])
    expect(result[0].db).toBe(2)
    expect(result[0].storage).toBe(1)
    expect(result[1].db).toBe(3)
    expect(result[1].storage).toBe(0)
  })

  it('stacks every product in a shared bucket so the height equals the request total', () => {
    const ts = '2024-01-01T00:00:00Z'
    const result = buildApiGatewayProductData({
      db: { eventChartData: [datum(ts, 10, 0, 0)] },
      postgrest: { eventChartData: [datum(ts, 5, 1, 0)] },
      auth: { eventChartData: [datum(ts, 4, 0, 0)] },
      functions: { eventChartData: [datum(ts, 3, 0, 1)] },
      storage: { eventChartData: [datum(ts, 2, 0, 0)] },
      realtime: { eventChartData: [datum(ts, 1, 0, 0)] },
    })

    expect(result).toHaveLength(1)
    const bucket = result[0]
    const stackedHeight =
      bucket.db +
      bucket.postgrest +
      bucket.auth +
      bucket.functions +
      bucket.storage +
      bucket.realtime
    expect(stackedHeight).toBe(27)
  })

  it('ignores services that are not API Gateway products', () => {
    const result = buildApiGatewayProductData({
      data_api: { eventChartData: [datum('2024-01-01T00:00:00Z', 999, 0, 0)] },
    })

    expect(result).toEqual([])
  })
})

describe('calculateApiGatewayAggregate', () => {
  it('returns zeroed metrics when there is no service data', () => {
    expect(calculateApiGatewayAggregate({})).toEqual({
      total: 0,
      errorCount: 0,
      warningCount: 0,
      errorRate: 0,
      successRate: 0,
    })
  })

  it('sums totals across products and derives the error rate', () => {
    const result = calculateApiGatewayAggregate({
      db: { total: 80, errorCount: 4, warningCount: 0 },
      auth: { total: 20, errorCount: 0, warningCount: 16 },
    })

    expect(result.total).toBe(100)
    expect(result.errorCount).toBe(4)
    expect(result.warningCount).toBe(16)
    expect(result.errorRate).toBe(4)
    expect(result.successRate).toBe(80)
  })

  it('ignores services that are not API Gateway products', () => {
    const result = calculateApiGatewayAggregate({
      db: { total: 80, errorCount: 4, warningCount: 0 },
      data_api: { total: 1000, errorCount: 50, warningCount: 50 },
    })

    expect(result.total).toBe(80)
    expect(result.errorCount).toBe(4)
  })
})

describe('chart and header agreement', () => {
  it('aggregate total equals the summed bucket heights of the product chart', () => {
    const serviceData = {
      db: {
        eventChartData: [
          datum('2024-01-01T00:00:00Z', 10, 1, 1),
          datum('2024-01-01T01:00:00Z', 5, 0, 0),
        ],
        total: 17,
        errorCount: 1,
        warningCount: 1,
      },
      storage: {
        eventChartData: [datum('2024-01-01T00:00:00Z', 4, 0, 2)],
        total: 6,
        errorCount: 2,
        warningCount: 0,
      },
      realtime: {
        eventChartData: [datum('2024-01-01T01:00:00Z', 3, 0, 0)],
        total: 3,
        errorCount: 0,
        warningCount: 0,
      },
    }

    const chartData = buildApiGatewayProductData(serviceData)
    const aggregate = calculateApiGatewayAggregate(serviceData)

    const stackedHeight = chartData.reduce(
      (sum, bucket) => sum + bucket.db + bucket.storage + bucket.realtime,
      0
    )

    expect(stackedHeight).toBe(aggregate.total)
    expect(aggregate.total).toBe(26)
  })
})
