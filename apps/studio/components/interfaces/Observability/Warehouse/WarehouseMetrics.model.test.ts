import { describe, expect, test } from 'vitest'

import {
  buildWarehouseChartModel,
  summarizeChartAvailability,
  type WarehouseChartInput,
} from './WarehouseMetrics.model'
import type {
  WarehouseMetric,
  WarehouseMetricName,
} from '@/data/warehouse/warehouse-metrics-api-types'

const T0 = 1_762_000_000
const series = (values: (number | null)[], labels: Record<string, string> = {}) => ({
  labels,
  points: values.map((value, index) => ({ timestamp: T0 + index * 60, value })),
  coverage: { returned_points: values.length, expected_points: values.length },
})
const metric = (
  name: WarehouseMetricName,
  overrides: Partial<WarehouseMetric> = {}
): WarehouseMetric => ({
  metric: name,
  project_ref: 'project',
  unit: 'per_second',
  aggregation: 'rate',
  definition: name,
  requested: { metric: name, start: T0, end: T0 + 60 },
  effective: { start: T0, end: T0 + 60, step: 60, rate_window_seconds: 300 },
  scrape_interval_seconds: 60,
  availability: 'ok',
  last_sample_at: T0 + 60,
  series: [series([1, 2])],
  ...overrides,
})
const chart = (name: WarehouseMetricName = 'query_rate'): WarehouseChartInput => ({
  format: '/s',
  primaryMetric: name,
  series: [{ metric: name, label: 'Value' }],
})
const model = (metrics: WarehouseMetric[], input = chart(), cap?: number) =>
  buildWarehouseChartModel({ metrics }, input, cap)

describe('Warehouse chart model', () => {
  test('sorts timestamps and preserves zero, null and non-finite gaps', () => {
    const result = model([metric('query_rate', { series: [series([0, null, Number.NaN, 4])] })])
    expect(result.rows.map((row) => row.s0)).toEqual([0, null, null, 4])
    expect(result.rows.map((row) => row.timestamp)).toEqual(
      [0, 60, 120, 180].map((offset) => new Date((T0 + offset) * 1000).toISOString())
    )
    expect(result.latestValue).toBe(4)
  })

  test('aligns series without manufacturing observations', () => {
    const second = series([5], { method: 'B' })
    second.points[0].timestamp += 60
    const result = model(
      [metric('rpc_rate', { series: [series([1, 2], { method: 'A' }), second] })],
      chart('rpc_rate')
    )
    expect(result.rows).toMatchObject([
      { s0: 1, s1: null },
      { s0: 2, s1: 5 },
    ])
    expect(result.attributes.map((item) => item.label)).toEqual(['Value · A', 'Value · B'])
    expect(result.highlight).toBe('none')
    expect(result.latestValue).toBeUndefined()
  })

  test('scales durations and highlights the primary metric rather than the first', () => {
    const input: WarehouseChartInput = {
      format: 'ms',
      primaryMetric: 'query_duration_p95',
      series: [
        { metric: 'query_duration_mean', label: 'Average' },
        { metric: 'query_duration_p95', label: 'p95' },
      ],
    }
    const metrics = [
      metric('query_duration_mean', { series: [series([0.1])] }),
      metric('query_duration_p95', { series: [series([0.5, null])] }),
    ]
    const result = model(metrics, input)
    expect(result.rows[0]).toMatchObject({ s0: 100, s1: 500 })
    expect(result.primaryKey).toBe('s1')
    expect(result.latestValue).toBe(500)
    expect(result.attributes.map((item) => item.stackId)).toEqual(['s0', 's1'])
    expect(model(metrics, { ...input, format: '/s' }).latestValue).toBe(0.5)
  })

  test('caps by peak and breaks ties by labels regardless of response order', () => {
    const samples = [
      series([5], { method: 'b' }),
      series([5], { method: 'a' }),
      series([1], { method: 'c' }),
    ]
    const result = model([metric('rpc_rate', { series: samples })], chart('rpc_rate'), 1)
    expect(result).toEqual(
      model([metric('rpc_rate', { series: [...samples].reverse() })], chart('rpc_rate'), 1)
    )
    expect(result.attributes[0].label).toBe('Value · a')
    expect(result.totalSeries).toBe(3)
    expect(result.shownSeries).toBe(1)
    expect(result.highlight).toBe('none')
  })

  test('retains capacity limits outside the cap without counting them as activity', () => {
    const input: WarehouseChartInput = {
      format: '',
      primaryMetric: 'worker_admission_occupied',
      series: [
        { metric: 'worker_admission_limit', label: 'Limit', isLimit: true },
        { metric: 'worker_admission_occupied', label: 'In use' },
      ],
    }
    const metrics = [
      metric('worker_admission_limit', { series: [series([10])] }),
      metric('worker_admission_occupied', { series: [series([3])] }),
    ]
    const result = model(metrics, input, 1)
    expect(result.shownSeries).toBe(1)
    expect(result.attributes).toHaveLength(2)
    expect(result.attributes[1]).toMatchObject({ label: 'Limit', isMaxValue: true })
    expect(result.latestValue).toBe(3)
    expect(model([metrics[0]], input).hasFiniteValues).toBe(false)
  })

  test('does not turn missing metrics or all-null values into zero', () => {
    expect(model([])).toMatchObject({
      rows: [],
      attributes: [],
      availability: { status: 'unavailable' },
    })
    expect(
      model([metric('query_rate', { availability: 'no_data', series: [series([null])] })])
    ).toMatchObject({
      hasFiniteValues: false,
      latestValue: undefined,
      availability: { status: 'no_data' },
    })
  })
})

describe('chart availability', () => {
  test.each<[WarehouseMetric['availability'][], boolean, string]>([
    [['ok'], true, 'ok'],
    [['partial', 'ok'], true, 'partial'],
    [['partial', 'stale'], true, 'stale'],
    [['stale', 'unavailable'], true, 'unavailable'],
    [['no_data'], false, 'no_data'],
    [['insufficient_data', 'no_data'], false, 'insufficient_data'],
    [['partial'], false, 'no_data'],
    [['insufficient_data', 'stale'], false, 'stale'],
  ])('%j with finite values=%s becomes %s', (statuses, hasValues, status) => {
    expect(
      summarizeChartAvailability(
        statuses.map((availability) => metric('query_rate', { availability })),
        hasValues
      ).status
    ).toBe(status)
  })
  test('uses the newest stale sample time, not a healthy series time', () => {
    expect(
      summarizeChartAvailability(
        [
          metric('query_rate', { availability: 'stale', last_sample_at: T0 }),
          metric('query_rate', { availability: 'stale', last_sample_at: T0 + 60 }),
          metric('query_rate', { last_sample_at: T0 + 120 }),
        ],
        true
      )
    ).toEqual({ status: 'stale', lastSampleAt: new Date((T0 + 60) * 1000).toISOString() })
    expect(summarizeChartAvailability([undefined], true).status).toBe('unavailable')
    expect(
      summarizeChartAvailability(
        [metric('query_rate', { availability: 'stale', last_sample_at: null })],
        false
      )
    ).toEqual({ status: 'stale', lastSampleAt: null })
  })
})
