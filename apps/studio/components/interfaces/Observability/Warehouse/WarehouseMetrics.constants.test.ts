import { describe, expect, test } from 'vitest'

import { getSectionAttributes, WAREHOUSE_METRICS_SECTIONS } from './WarehouseMetrics.constants'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

const ALL_METRICS: WarehouseMetricName[] = [
  'activation_duration_mean',
  'activation_duration_p95',
  'activation_rate',
  'admission_rejection_rate',
  'assignment_wait_mean',
  'assignment_wait_p95',
  'duckdb_duration_mean',
  'query_canceled_rate',
  'query_duration_mean',
  'query_duration_p50',
  'query_duration_p95',
  'query_duration_p99',
  'query_error_rate',
  'query_in_flight',
  'query_rate',
  'query_timeout_rate',
  'rpc_duration_mean',
  'rpc_duration_p95',
  'rpc_rate',
  'worker_admission_active',
  'worker_admission_limit',
  'worker_admission_occupied',
  'worker_admission_pending',
]

const FORBIDDEN_COPY = /quaxy|quack|executor|admission|controller|assignment|iceberg/i

const allCharts = WAREHOUSE_METRICS_SECTIONS.flatMap((section) => section.charts)

describe('WAREHOUSE_METRICS_SECTIONS', () => {
  test('only uses metric names the API accepts', () => {
    const used = allCharts.flatMap((chart) => chart.series.map((series) => series.metric))
    for (const metric of used) expect(ALL_METRICS).toContain(metric)
  })

  test('uses every metric exactly once', () => {
    const used = allCharts.flatMap((chart) => chart.series.map((series) => series.metric))
    expect([...used].sort()).toEqual([...ALL_METRICS].sort())
  })

  test('each section fits in one request', () => {
    for (const section of WAREHOUSE_METRICS_SECTIONS) {
      expect(getSectionAttributes(section).length).toBeLessThanOrEqual(8)
    }
    expect(WAREHOUSE_METRICS_SECTIONS.map((s) => getSectionAttributes(s).length)).toEqual([
      5, 7, 5, 6,
    ])
  })

  test('every chart highlights one of its own metrics', () => {
    for (const chart of allCharts) {
      expect(chart.series.map((series) => series.metric)).toContain(chart.primaryMetric)
    }
    expect(allCharts).toHaveLength(12)
  })

  test('customer-facing copy avoids internal names', () => {
    for (const section of WAREHOUSE_METRICS_SECTIONS) {
      expect(`${section.title} ${section.description}`).not.toMatch(FORBIDDEN_COPY)
    }
    for (const chart of allCharts) {
      expect(chart.title).not.toMatch(FORBIDDEN_COPY)
      expect(chart.tooltip).not.toMatch(FORBIDDEN_COPY)
      for (const series of chart.series) expect(series.label).not.toMatch(FORBIDDEN_COPY)
    }
  })

  test('only the worker slot limit is a reference line', () => {
    const limits = allCharts.flatMap((chart) => chart.series.filter((series) => series.isLimit))
    expect(limits.map((series) => series.metric)).toEqual(['worker_admission_limit'])
  })
})

describe('getSectionAttributes', () => {
  test('returns distinct metrics in declaration order', () => {
    const [queries] = WAREHOUSE_METRICS_SECTIONS
    expect(getSectionAttributes(queries)).toEqual([
      'query_rate',
      'query_in_flight',
      'query_error_rate',
      'query_timeout_rate',
      'query_canceled_rate',
    ])
  })

  test('removes duplicates', () => {
    const [queries] = WAREHOUSE_METRICS_SECTIONS
    const duplicated = { ...queries, charts: [...queries.charts, ...queries.charts] }
    expect(getSectionAttributes(duplicated)).toHaveLength(5)
  })
})
