import { describe, expect, test } from 'vitest'

import { getWarehouseSummaryValue } from './WarehouseObservabilitySection.utils'
import { createWarehouseMetric } from '@/components/interfaces/Observability/Warehouse/WarehouseMetrics.fixtures'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

const metric = (overrides: Partial<WarehouseMetric> = {}) =>
  createWarehouseMetric('query_rate', {
    series: [
      {
        labels: {},
        points: [{ timestamp: 100, value: 0 }],
        coverage: { returned_points: 1, expected_points: 1 },
      },
    ],
    ...overrides,
  })

describe('getWarehouseSummaryValue', () => {
  test('preserves observed zero traffic', () => {
    expect(getWarehouseSummaryValue({ metrics: [metric()] }, 'query_rate')).toMatchObject({
      value: 0,
      timestamp: 100,
    })
  })

  test('does not reuse an older value across a missing latest interval', () => {
    const data = metric({
      series: [
        {
          labels: {},
          points: [
            { timestamp: 100, value: 4 },
            { timestamp: 160, value: null },
          ],
          coverage: { returned_points: 1, expected_points: 2 },
        },
      ],
    })
    expect(getWarehouseSummaryValue({ metrics: [data] }, 'query_rate').value).toBeNull()
  })

  test('keeps stale values unavailable rather than showing past traffic as current', () => {
    expect(
      getWarehouseSummaryValue({ metrics: [metric({ availability: 'stale' })] }, 'query_rate')
    ).toMatchObject({ availability: 'stale', value: null })
  })

  test('preserves the coverage warning alongside a partial observation', () => {
    expect(
      getWarehouseSummaryValue({ metrics: [metric({ availability: 'partial' })] }, 'query_rate')
    ).toMatchObject({ availability: 'partial', value: 0 })
  })

  test('does not collapse multiple series into one observation', () => {
    const data = metric()
    data.series = [...data.series, ...data.series]
    expect(getWarehouseSummaryValue({ metrics: [data] }, 'query_rate').value).toBeNull()
  })
})
