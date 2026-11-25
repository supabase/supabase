import { describe, expect, test, vi } from 'vitest'

import {
  decodeWarehouseTableKey,
  expandWarehouseChartSeries,
  formatWarehouseBytes,
  formatWarehouseBytesPerSecond,
  formatWarehouseCount,
  formatWarehouseDuration,
  formatWarehouseEtlLabels,
  formatWarehouseNumber,
  formatWarehousePaused,
  formatWarehousePerMinute,
  formatWarehousePerSecond,
  formatWarehouseRatio,
  formatWarehouseUnitValue,
  getWarehouseInlinedTableRows,
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

describe('formatWarehouseUnitValue', () => {
  test('appends the unit the way the matching formatters do', () => {
    expect(formatWarehouseUnitValue(0.4125, '/s')).toBe('0.413/s')
    expect(formatWarehouseUnitValue(1234.5, '/s')).toBe('1,234.5/s')
    expect(formatWarehouseUnitValue(12.3456, 'ms')).toBe('12.346 ms')
    expect(formatWarehouseUnitValue(0, 'ms')).toBe('0 ms')
  })
})

describe('warehouse number formatting', () => {
  test('formats numbers the same way whatever the browser locale', () => {
    const original = Number.prototype.toLocaleString
    // Simulate a French browser: calls without an explicit locale use fr-FR
    const spy = vi.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function (
      this: number,
      locales?,
      options?
    ) {
      return original.call(this, locales ?? 'fr-FR', options)
    })

    try {
      expect(formatWarehouseCount(0.4)).toBe('0.4')
      expect(formatWarehousePerSecond(1.25)).toBe('1.25/s')
      expect(formatWarehouseRatio(0.325)).toBe('32.5%')
      expect(formatWarehouseDuration(1.5)).toBe('1.5 s')
      expect(formatWarehouseBytes(0.5)).toBe('0.5 bytes')
      expect(formatWarehouseNumber(1234.5678)).toBe('1,234.568')
      expect(formatWarehouseUnitValue(0.4125, '/s')).toBe('0.413/s')
    } finally {
      spy.mockRestore()
    }
  })
})

const hex = (value: string) => Buffer.from(value).toString('hex')

describe('decodeWarehouseTableKey', () => {
  test('decodes a namespaced key, including non-ASCII names', () => {
    expect(
      decodeWarehouseTableKey(`v2:${hex('lake')}:${hex('public')}:${hex('tâble_é 表')}`)
    ).toEqual({ namespace: 'lake', name: 'public.tâble_é 表' })
  })

  test('keeps legacy schema.table keys', () => {
    expect(decodeWarehouseTableKey('public.orders')).toEqual({ name: 'public.orders' })
  })

  test.each([
    ['malformed hex', `v2:${hex('a')}:zz:${hex('c')}`],
    ['odd-length hex', `v2:${hex('a')}:abc:${hex('c')}`],
    ['empty part', `v2:${hex('a')}::${hex('c')}`],
    ['invalid UTF-8', `v2:${hex('a')}:ff:${hex('c')}`],
    ['too few parts', `v2:${hex('a')}:${hex('b')}`],
    ['too many parts', `v2:${hex('a')}:${hex('b')}:${hex('c')}:${hex('d')}`],
    ['unknown version', `v3:${hex('a')}:${hex('b')}:${hex('c')}`],
  ])('falls back to the raw key for %s', (_, key) => {
    expect(decodeWarehouseTableKey(key)).toEqual({ name: key })
  })
})

describe('getWarehouseInlinedTableRows', () => {
  const inlinedMetric = (
    series: {
      labels: Record<string, string>
      points: { timestamp: number; value: number | null }[]
    }[]
  ): WarehouseMetric => ({
    ...metricWithSeries([]),
    series: series.map((item) => ({
      ...item,
      coverage: { returned_points: item.points.length, expected_points: item.points.length },
    })),
  })

  test('returns no rows without a metric', () => {
    expect(getWarehouseInlinedTableRows(undefined)).toEqual([])
  })

  test('uses the latest timestamp for latest, even when points are out of order', () => {
    const [row] = getWarehouseInlinedTableRows(
      inlinedMetric([
        {
          labels: { table: 'public.a' },
          points: [
            { timestamp: 300, value: 5 },
            { timestamp: 100, value: 50 },
            { timestamp: 200, value: 20 },
          ],
        },
      ])
    )
    expect(row).toMatchObject({ name: 'public.a', latest: 5, peak: 50 })
  })

  test('skips null and non-finite values and drops series without values', () => {
    const rows = getWarehouseInlinedTableRows(
      inlinedMetric([
        {
          labels: { table: 'public.a' },
          points: [
            { timestamp: 100, value: 7 },
            { timestamp: 200, value: null },
            { timestamp: 300, value: Number.NaN },
            { timestamp: 400, value: Number.POSITIVE_INFINITY },
          ],
        },
        { labels: { table: 'public.empty' }, points: [] },
        { labels: { table: 'public.nulls' }, points: [{ timestamp: 100, value: null }] },
      ])
    )
    expect(rows).toEqual([{ key: '0', name: 'public.a', latest: 7, peak: 7 }])
  })

  test('sorts by latest, then peak, then name', () => {
    const point = (value: number) => [{ timestamp: 100, value }]
    const rows = getWarehouseInlinedTableRows(
      inlinedMetric([
        { labels: { table: 'public.small' }, points: point(1) },
        { labels: { table: 'public.b' }, points: point(10) },
        { labels: { table: 'public.a' }, points: point(10) },
        {
          labels: { table: 'public.peaky' },
          points: [
            { timestamp: 100, value: 99 },
            { timestamp: 200, value: 10 },
          ],
        },
        { labels: { table: 'public.big' }, points: point(500) },
      ])
    )
    expect(rows.map((row) => row.name)).toEqual([
      'public.big',
      'public.peaky',
      'public.a',
      'public.b',
      'public.small',
    ])
    expect(new Set(rows.map((row) => row.key)).size).toBe(5)
  })

  test('uses a fallback name for series without a table label', () => {
    const [row] = getWarehouseInlinedTableRows(
      inlinedMetric([{ labels: {}, points: [{ timestamp: 100, value: 1 }] }])
    )
    expect(row.name).toBe('Unknown table')
  })

  test('shows namespace and pipeline only when they differ between rows', () => {
    const points = [{ timestamp: 100, value: 1 }]
    const key = (namespace: string) => `v2:${hex(namespace)}:${hex('public')}:${hex('t')}`

    expect(
      getWarehouseInlinedTableRows(
        inlinedMetric([
          { labels: { pipeline_id: '1', table: key('lake') }, points },
          { labels: { pipeline_id: '1', table: key('lake') }, points },
        ])
      ).map((row) => row.name)
    ).toEqual(['public.t', 'public.t'])

    expect(
      getWarehouseInlinedTableRows(
        inlinedMetric([
          { labels: { pipeline_id: '1', table: key('one') }, points },
          { labels: { pipeline_id: '2', table: key('one') }, points },
        ])
      ).map((row) => row.name)
    ).toEqual(['public.t · Pipeline 1', 'public.t · Pipeline 2'])

    expect(
      getWarehouseInlinedTableRows(
        inlinedMetric([
          { labels: { pipeline_id: '1', table: key('one') }, points },
          { labels: { pipeline_id: '1', table: key('two') }, points },
          { labels: { pipeline_id: '1', table: 'public.legacy' }, points },
        ])
      ).map((row) => row.name)
    ).toEqual(['one · public.t', 'public.legacy', 'two · public.t'])
  })
})
