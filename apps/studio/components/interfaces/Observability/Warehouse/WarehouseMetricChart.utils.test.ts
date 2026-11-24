import { describe, expect, test } from 'vitest'

import {
  expandWarehouseChartSeries,
  formatWarehouseBytes,
  formatWarehouseBytesPerSecond,
  formatWarehouseCount,
  formatWarehouseDuration,
  formatWarehouseEtlLabels,
  formatWarehousePaused,
  formatWarehousePerMinute,
  formatWarehousePerSecond,
  formatWarehouseRatio,
  WAREHOUSE_ETL_LABEL_PROPS,
} from './WarehouseMetricChart.utils'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

const metricWithSeries = (labelSets: Record<string, string>[]): WarehouseMetric => ({
  project_ref: 'default',
  metric: 'replication_wal_lag_bytes',
  unit: 'bytes',
  aggregation: 'mean',
  definition: 'Replication lag',
  requested: { metric: 'replication_wal_lag_bytes', start: 100, end: 160, step: 60 },
  effective: { start: 100, end: 160, step: 60, rate_window_seconds: 60 },
  scrape_interval_seconds: 60,
  last_sample_at: 160,
  availability: 'ok',
  series: labelSets.map((labels) => ({
    labels,
    coverage: { returned_points: 1, expected_points: 1 },
    points: [{ timestamp: 160, value: 1 }],
  })),
})

describe('value formatters', () => {
  test('formats counts with at most one fraction digit', () => {
    expect(formatWarehouseCount(12.5)).toBe('12.5')
    expect(formatWarehouseCount(1234)).toBe('1,234')
    expect(formatWarehouseCount(12.34)).toBe('12.3')
  })

  test('formats rates per second and per minute', () => {
    expect(formatWarehousePerSecond(1.2345)).toBe('1.23/s')
    expect(formatWarehousePerMinute(0.00333)).toBe('0.2/min')
    expect(formatWarehousePerMinute(1)).toBe('60/min')
  })

  test('formats bytes, including values below one byte', () => {
    expect(formatWarehouseBytes(1536)).toBe('1.5 KB')
    expect(formatWarehouseBytes(0)).toBe('0 bytes')
    expect(formatWarehouseBytes(0.256)).toBe('0.26 bytes')
    expect(formatWarehouseBytes(-0.5)).toBe('-0.5 bytes')
    expect(formatWarehouseBytes(512)).toBe('512 bytes')
    expect(formatWarehouseBytesPerSecond(1536)).toBe('1.5 KB/s')
    expect(formatWarehouseBytesPerSecond(0.5)).toBe('0.5 bytes/s')
  })

  test('formats ratios as percentages', () => {
    expect(formatWarehouseRatio(0.125)).toBe('12.5%')
    expect(formatWarehouseRatio(0)).toBe('0%')
    expect(formatWarehouseRatio(1)).toBe('100%')
  })

  test.each([
    [0.25, '250 ms'],
    [0, '0 ms'],
    [12.34, '12.3 s'],
    [59.96, '60 s'],
    [60, '1m'],
    [120, '2m'],
    [3725, '1h 2m'],
    [90061, '1d 1h'],
    [3600, '1h'],
    [-0.25, '-250 ms'],
    [-3725, '-1h 2m'],
  ])('formats %s seconds as %s', (seconds, expected) => {
    expect(formatWarehouseDuration(seconds)).toBe(expected)
  })

  test('formats the pause flag', () => {
    expect(formatWarehousePaused(1)).toBe('Paused')
    expect(formatWarehousePaused(0)).toBe('Not paused')
  })
})

describe('formatWarehouseEtlLabels', () => {
  test.each([
    ['apply', 'cdc', 'Live changes'],
    ['table_sync', 'copy', 'Initial copy'],
    ['table_sync', 'cdc', 'Initial copy catch-up'],
    ['apply', 'copy', 'Apply Copy'],
  ])('combines %s and %s into one worker path part', (worker_type, replication_path, text) => {
    expect(formatWarehouseEtlLabels({ worker_type, replication_path })).toEqual([
      { key: 'worker_path', text },
    ])
  })

  test('names change types', () => {
    expect(
      ['copy', 'insert', 'update', 'delete'].map(
        (event_type) => formatWarehouseEtlLabels({ event_type })[0].text
      )
    ).toEqual(['Initial copy', 'Inserts', 'Updates', 'Deletes'])
  })

  test('names operations, reasons, and results', () => {
    expect(formatWarehouseEtlLabels({ operation: 'cleanup_old_files' })[0].text).toBe(
      'Clean up old files'
    )
    expect(formatWarehouseEtlLabels({ operation: 'flush_inlined_data' })[0].text).toBe(
      'Flush inlined data'
    )
    expect(
      [
        'pending_inlined_data_bytes_threshold',
        'active_data_files_threshold',
        'deleted_row_ratio_threshold',
        'snapshot_retention_threshold',
      ].map((reason) => formatWarehouseEtlLabels({ reason })[0].text)
    ).toEqual([
      'Inlined data threshold',
      'Data file threshold',
      'Deleted row threshold',
      'Snapshot retention',
    ])
    expect(formatWarehouseEtlLabels({ result: 'noop' })[0].text).toBe('Nothing to flush')
    expect(formatWarehouseEtlLabels({ result: 'flushed' })[0].text).toBe('Flushed')
  })

  test('keeps table names and labels pipelines', () => {
    expect(formatWarehouseEtlLabels({ table: 'public.orders', pipeline_id: '12' })).toEqual([
      { key: 'table', text: 'public.orders' },
      { key: 'pipeline_id', text: 'Pipeline 12' },
    ])
  })

  test('humanizes anything else', () => {
    expect(formatWarehouseEtlLabels({ some_label: 'two_words' })).toEqual([
      { key: 'some_label', text: 'Two words' },
    ])
  })

  test('orders parts with the pipeline last and unknown keys sorted in between', () => {
    const parts = formatWarehouseEtlLabels({
      pipeline_id: '1',
      zeta: 'z',
      table: 'public.t',
      result: 'flushed',
      outcome: 'succeeded',
      reason: 'active_data_files_threshold',
      operation: 'expire_snapshots',
      trigger: 'scheduled',
      event_type: 'insert',
      replication_path: 'cdc',
      alpha: 'a',
      worker_type: 'apply',
    })
    expect(parts.map((part) => part.key)).toEqual([
      'worker_path',
      'event_type',
      'trigger',
      'operation',
      'reason',
      'outcome',
      'result',
      'table',
      'alpha',
      'zeta',
      'pipeline_id',
    ])
  })
})

describe('expandWarehouseChartSeries options', () => {
  const lag = (labels: Record<string, string>[]) => [
    { metric: metricWithSeries(labels), label: 'Lag' },
  ]

  test('labels series with raw values sorted by key when called without options', () => {
    expect(
      expandWarehouseChartSeries(lag([{ worker_type: 'apply', pipeline_id: '1' }])).map(
        (item) => item.label
      )
    ).toEqual(['Lag · 1 · apply'])
    expect(expandWarehouseChartSeries([{ label: 'Missing' }]).map((item) => item.label)).toEqual([
      'Missing',
    ])
  })

  test('hides labels shared by every series for a single pipeline', () => {
    const labels = expandWarehouseChartSeries(
      lag([{ pipeline_id: '1', worker_type: 'apply', replication_path: 'cdc' }]),
      WAREHOUSE_ETL_LABEL_PROPS
    ).map((item) => item.label)
    expect(labels).toEqual(['Lag'])
  })

  test('shows the pipeline when pipelines differ', () => {
    const labels = expandWarehouseChartSeries(
      lag([
        { pipeline_id: '1', worker_type: 'apply', replication_path: 'cdc' },
        { pipeline_id: '12', worker_type: 'apply', replication_path: 'cdc' },
      ]),
      WAREHOUSE_ETL_LABEL_PROPS
    ).map((item) => item.label)
    expect(labels).toEqual(['Lag · Pipeline 1', 'Lag · Pipeline 12'])
  })

  test('keeps the worker path when it differs', () => {
    const labels = expandWarehouseChartSeries(
      lag([
        { pipeline_id: '1', worker_type: 'apply', replication_path: 'cdc' },
        { pipeline_id: '1', worker_type: 'table_sync', replication_path: 'copy' },
      ]),
      WAREHOUSE_ETL_LABEL_PROPS
    ).map((item) => item.label)
    expect(labels).toEqual(['Lag · Live changes', 'Lag · Initial copy'])
  })

  test('ignores series without labels when finding shared parts', () => {
    const labels = expandWarehouseChartSeries(
      [
        { metric: metricWithSeries([{ pipeline_id: '1' }]), label: 'Received' },
        { metric: metricWithSeries([]), label: 'Processed' },
        { label: 'Missing' },
      ],
      WAREHOUSE_ETL_LABEL_PROPS
    ).map((item) => item.label)
    expect(labels).toEqual(['Received', 'Processed', 'Missing'])
  })

  test('uses a custom formatter without hiding anything by default', () => {
    const labels = expandWarehouseChartSeries(lag([{ pipeline_id: '1' }]), {
      formatLabels: formatWarehouseEtlLabels,
    }).map((item) => item.label)
    expect(labels).toEqual(['Lag · Pipeline 1'])
  })
})
