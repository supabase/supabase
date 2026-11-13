import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { WAREHOUSE_METRICS_SECTIONS, type WarehouseChartDef } from './WarehouseMetrics.constants'
import { createWarehouseMetric, createWarehouseMetricsResponse } from './WarehouseMetrics.fixtures'
import {
  buildWarehouseChartModel,
  formatSeriesLabel,
  getWarehouseMetricsInterval,
  getWarehouseMetricsPageState,
  resolveWarehouseMetricsRange,
  summarizeChartAvailability,
} from './WarehouseMetrics.utils'
import { REPORTS_DATEPICKER_HELPERS } from '@/components/interfaces/Reports/Reports.constants'
import type {
  WarehouseMetric,
  WarehouseMetricsResponse,
} from '@/data/warehouse/warehouse-metrics-api-types'
import { PlatformError } from '@/lib/errors/studio-errors'

const T0 = 1_762_000_000

const rateChart: WarehouseChartDef = {
  id: 'rate',
  title: 'Rate',
  tooltip: 'Rate',
  format: '/s',
  primaryMetric: 'query_rate',
  series: [{ metric: 'query_rate', label: 'Queries' }],
}

const durationChart: WarehouseChartDef = {
  id: 'duration',
  title: 'Duration',
  tooltip: 'Duration',
  format: 'ms',
  primaryMetric: 'query_duration_p95',
  series: [
    { metric: 'query_duration_mean', label: 'Average' },
    { metric: 'query_duration_p95', label: 'p95' },
  ],
}

const slotsChart: WarehouseChartDef = {
  id: 'slots',
  title: 'Slots',
  tooltip: 'Slots',
  format: '',
  primaryMetric: 'worker_admission_occupied',
  series: [
    { metric: 'worker_admission_limit', label: 'Limit', isLimit: true },
    { metric: 'worker_admission_occupied', label: 'In use' },
  ],
}

const labeledChart: WarehouseChartDef = {
  id: 'rpc',
  title: 'Requests',
  tooltip: 'Requests',
  format: '/s',
  primaryMetric: 'rpc_rate',
  series: [{ metric: 'rpc_rate', label: 'Requests' }],
}

const makeSeries = (labels: Record<string, string>, values: (number | null)[]) => ({
  labels,
  points: values.map((value, index) => ({ timestamp: T0 + index * 60, value })),
  coverage: { returned_points: values.length, expected_points: values.length },
})

const withSeries = (
  metric: Parameters<typeof createWarehouseMetric>[0],
  series: WarehouseMetric['series'],
  overrides: Partial<WarehouseMetric> = {}
): WarehouseMetricsResponse => ({
  metrics: [createWarehouseMetric(metric, { series, ...overrides })],
})

describe('formatSeriesLabel', () => {
  test('joins the base and label values in key order', () => {
    expect(formatSeriesLabel('Requests', { status: 'ok', method: 'DoGet' })).toBe(
      'Requests · DoGet · ok'
    )
  })

  test('skips empty parts', () => {
    expect(formatSeriesLabel('Average', {})).toBe('Average')
    expect(formatSeriesLabel('', { kind: 'cold', result: '' })).toBe('cold')
  })
})

describe('buildWarehouseChartModel', () => {
  test('converts unix seconds to ISO timestamps in ascending order', () => {
    const response = withSeries('query_rate', [makeSeries({}, [1, 2, 3])])
    const { rows } = buildWarehouseChartModel(response, rateChart)
    expect(rows.map((row) => row.timestamp)).toEqual([
      new Date(T0 * 1000).toISOString(),
      new Date((T0 + 60) * 1000).toISOString(),
      new Date((T0 + 120) * 1000).toISOString(),
    ])
  })

  test('keeps missing values as null and never as zero', () => {
    const response = withSeries('query_rate', [makeSeries({}, [1, null, Number.NaN, 0])])
    const { rows } = buildWarehouseChartModel(response, rateChart)
    expect(rows.map((row) => row.s0)).toEqual([1, null, null, 0])
  })

  test('puts every series key in every row, even where a series has no point', () => {
    const response = withSeries('rpc_rate', [
      makeSeries({ method: 'A' }, [1, 2]),
      {
        labels: { method: 'B' },
        points: [{ timestamp: T0 + 60, value: 5 }],
        coverage: { returned_points: 1, expected_points: 2 },
      },
    ])
    const { rows } = buildWarehouseChartModel(response, labeledChart)
    expect(rows).toHaveLength(2)
    for (const row of rows) expect(Object.keys(row).sort()).toEqual(['s0', 's1', 'timestamp'])
    expect(rows[0].s1).toBeNull()
    expect(rows[1].s1).toBe(5)
  })

  test('converts durations from seconds to milliseconds only for ms charts', () => {
    const response = createWarehouseMetricsResponse(['query_duration_mean', 'query_duration_p95'])
    response.metrics[0].series = [makeSeries({}, [0.25])]
    response.metrics[1].series = [makeSeries({}, [1.5])]
    const ms = buildWarehouseChartModel(response, durationChart)
    expect(ms.rows[0]).toMatchObject({ s0: 250, s1: 1500 })

    const rate = buildWarehouseChartModel(
      withSeries('query_rate', [makeSeries({}, [0.25])]),
      rateChart
    )
    expect(rate.rows[0].s0).toBe(0.25)
  })

  test('uses opaque attribute keys and labels series from the definition and labels', () => {
    const response = withSeries('rpc_rate', [makeSeries({ method: 'DoGet', status: 'ok' }, [1])])
    const { attributes } = buildWarehouseChartModel(response, labeledChart)
    expect(attributes).toEqual([{ attribute: 's0', label: 'Requests · DoGet · ok', stackId: 's0' }])
  })

  test('never shares a stack between series', () => {
    const response = createWarehouseMetricsResponse(['query_duration_mean', 'query_duration_p95'])
    const { attributes } = buildWarehouseChartModel(response, durationChart)
    const stacks = attributes.map((attribute) => attribute.stackId)
    expect(new Set(stacks).size).toBe(stacks.length)
  })

  test('keeps only the highest-peak series when over the cap', () => {
    const response = withSeries(
      'rpc_rate',
      ['a', 'b', 'c', 'd'].map((method, index) => makeSeries({ method }, [index + 1, index]))
    )
    const model = buildWarehouseChartModel(response, labeledChart, 2)
    expect(model.totalSeries).toBe(4)
    expect(model.shownSeries).toBe(2)
    expect(model.attributes.map((attribute) => attribute.label)).toEqual([
      'Requests · c',
      'Requests · d',
    ])
  })

  test('marks the limit series and does not count it against the cap', () => {
    const response: WarehouseMetricsResponse = {
      metrics: [
        createWarehouseMetric('worker_admission_limit', { series: [makeSeries({}, [10, 10])] }),
        createWarehouseMetric('worker_admission_occupied', {
          series: [makeSeries({}, [3, 4])],
        }),
      ],
    }
    const model = buildWarehouseChartModel(response, slotsChart, 1)
    expect(model.totalSeries).toBe(1)
    expect(model.shownSeries).toBe(1)
    expect(model.attributes).toHaveLength(2)
    expect(model.attributes.find((attribute) => attribute.label === 'Limit')).toMatchObject({
      isMaxValue: true,
    })
    expect(
      model.attributes.find((attribute) => attribute.label === 'In use')?.isMaxValue
    ).toBeUndefined()
    expect(model.primaryKey).toBe('s0')
  })

  test('produces the same output regardless of the order series arrive in', () => {
    const series = ['a', 'b', 'c', 'd', 'e'].map((method, index) =>
      makeSeries({ method }, [index % 3, (index * 2) % 5, 1])
    )
    const forward = buildWarehouseChartModel(withSeries('rpc_rate', series), labeledChart, 3)
    const shuffled = buildWarehouseChartModel(
      withSeries('rpc_rate', [series[3], series[0], series[4], series[2], series[1]]),
      labeledChart,
      3
    )
    expect(shuffled).toEqual(forward)
  })

  test('breaks peak ties by label so the kept set is deterministic', () => {
    const series = ['b', 'a', 'c'].map((method) => makeSeries({ method }, [5]))
    const model = buildWarehouseChartModel(withSeries('rpc_rate', series), labeledChart, 2)
    expect(model.attributes.map((attribute) => attribute.label)).toEqual([
      'Requests · a',
      'Requests · b',
    ])
  })

  test('latestValue skips trailing nulls', () => {
    const response = withSeries('query_rate', [makeSeries({}, [1, 7, null, null])])
    const model = buildWarehouseChartModel(response, rateChart)
    expect(model.latestValue).toBe(7)
    expect(model.primaryKey).toBe('s0')
  })

  test('latestValue and primaryKey use the primary metric, not the first series', () => {
    const response: WarehouseMetricsResponse = {
      metrics: [
        createWarehouseMetric('query_duration_mean', { series: [makeSeries({}, [0.1, 0.2])] }),
        createWarehouseMetric('query_duration_p95', { series: [makeSeries({}, [0.5, 0.9])] }),
      ],
    }
    const model = buildWarehouseChartModel(response, durationChart)
    expect(model.primaryKey).toBe('s1')
    expect(model.latestValue).toBe(900)
  })

  test('reports no finite values when every point is null', () => {
    const response = withSeries('query_rate', [makeSeries({}, [null, null])], {
      availability: 'no_data',
    })
    const model = buildWarehouseChartModel(response, rateChart)
    expect(model.hasFiniteValues).toBe(false)
    expect(model.latestValue).toBeUndefined()
    expect(model.availability).toEqual({ status: 'no_data' })
  })

  test('handles a metric the response does not include', () => {
    const model = buildWarehouseChartModel({ metrics: [] }, rateChart)
    expect(model.rows).toEqual([])
    expect(model.attributes).toEqual([])
    expect(model.primaryKey).toBeUndefined()
    expect(model.availability).toEqual({ status: 'unavailable' })
  })

  test('is ok for healthy data', () => {
    const model = buildWarehouseChartModel(
      createWarehouseMetricsResponse(['query_rate']),
      rateChart
    )
    expect(model.hasFiniteValues).toBe(true)
    expect(model.availability).toEqual({ status: 'ok' })
  })
})

describe('buildWarehouseChartModel highlight', () => {
  test('is primary with a latest value when the primary metric has one series', () => {
    const model = buildWarehouseChartModel(
      withSeries('query_rate', [makeSeries({}, [1, 7])]),
      rateChart
    )
    expect(model.highlight).toBe('primary')
    expect(model.latestValue).toBe(7)
  })

  test('hides the headline for a single rate metric split by labels', () => {
    const response = withSeries('rpc_rate', [
      makeSeries({ method: 'A' }, [1, 2]),
      makeSeries({ method: 'B' }, [3, 4]),
    ])
    const model = buildWarehouseChartModel(response, labeledChart)
    expect(model.highlight).toBe('none')
    expect(model.latestValue).toBeUndefined()
  })

  test('hides the headline when labeled count series have missing values', () => {
    const chart: WarehouseChartDef = { ...labeledChart, format: '' }
    const response = withSeries('rpc_rate', [
      makeSeries({ method: 'A' }, [1, null]),
      makeSeries({ method: 'B' }, [3, null]),
    ])
    const model = buildWarehouseChartModel(response, chart)
    expect(model.highlight).toBe('none')
    expect(model.latestValue).toBeUndefined()
    expect(model.rows[1]).toMatchObject({ s0: null, s1: null })
  })

  test('is none for a duration chart split by labels', () => {
    const chart: WarehouseChartDef = {
      ...durationChart,
      primaryMetric: 'query_duration_p95',
    }
    const response: WarehouseMetricsResponse = {
      metrics: [
        createWarehouseMetric('query_duration_mean', { series: [makeSeries({}, [0.1])] }),
        createWarehouseMetric('query_duration_p95', {
          series: [makeSeries({ method: 'A' }, [0.5]), makeSeries({ method: 'B' }, [0.9])],
        }),
      ],
    }
    const model = buildWarehouseChartModel(response, chart)
    expect(model.highlight).toBe('none')
    expect(model.latestValue).toBeUndefined()
  })

  test('is none for a single duration metric split by labels', () => {
    const chart: WarehouseChartDef = {
      ...durationChart,
      primaryMetric: 'query_duration_mean',
      series: [{ metric: 'query_duration_mean', label: 'Average' }],
    }
    const response = withSeries('query_duration_mean', [
      makeSeries({ method: 'A' }, [0.1]),
      makeSeries({ method: 'B' }, [0.2]),
    ])
    expect(buildWarehouseChartModel(response, chart).highlight).toBe('none')
  })

  test('is none when a split primary sits in a multi-metric chart with a summable format', () => {
    const chart: WarehouseChartDef = {
      ...labeledChart,
      series: [
        { metric: 'rpc_rate', label: 'Requests' },
        { metric: 'query_rate', label: 'Queries' },
      ],
    }
    const response: WarehouseMetricsResponse = {
      metrics: [
        createWarehouseMetric('rpc_rate', {
          series: [makeSeries({ method: 'A' }, [1]), makeSeries({ method: 'B' }, [2])],
        }),
        createWarehouseMetric('query_rate', { series: [makeSeries({}, [3])] }),
      ],
    }
    expect(buildWarehouseChartModel(response, chart).highlight).toBe('none')
  })

  test('is primary in a multi-metric chart when the primary metric has one series', () => {
    const response = createWarehouseMetricsResponse(['query_duration_mean', 'query_duration_p95'])
    response.metrics[0].series = [
      makeSeries({ method: 'A' }, [0.1]),
      makeSeries({ method: 'B' }, [0.2]),
    ]
    response.metrics[1].series = [makeSeries({}, [0.5, 0.9])]
    const model = buildWarehouseChartModel(response, durationChart)
    expect(model.highlight).toBe('primary')
    expect(model.latestValue).toBe(900)
  })

  test('ignores limit series when counting the primary metric', () => {
    const response: WarehouseMetricsResponse = {
      metrics: [
        createWarehouseMetric('worker_admission_limit', {
          series: [makeSeries({ a: '1' }, [10]), makeSeries({ a: '2' }, [10])],
        }),
        createWarehouseMetric('worker_admission_occupied', { series: [makeSeries({}, [3, 4])] }),
      ],
    }
    const model = buildWarehouseChartModel(response, slotsChart)
    expect(model.highlight).toBe('primary')
    expect(model.latestValue).toBe(4)
  })

  test('is decided from every series, not only the ones kept by the cap', () => {
    const response = withSeries('rpc_rate', [
      makeSeries({ method: 'a' }, [5]),
      makeSeries({ method: 'b' }, [1]),
    ])
    const model = buildWarehouseChartModel(response, labeledChart, 1)
    expect(model.shownSeries).toBe(1)
    expect(model.totalSeries).toBe(2)
    expect(model.highlight).toBe('none')
    expect(model.latestValue).toBeUndefined()
  })

  test('assigns the expected mode to every real chart under the default fixtures', () => {
    const modes = Object.fromEntries(
      WAREHOUSE_METRICS_SECTIONS.flatMap((section) => section.charts).map((chart) => {
        const response = createWarehouseMetricsResponse(chart.series.map((def) => def.metric))
        return [chart.id, buildWarehouseChartModel(response, chart).highlight]
      })
    )
    expect(modes).toEqual({
      'query-rate': 'primary',
      'queries-in-progress': 'primary',
      'failed-queries': 'primary',
      'query-duration': 'primary',
      'worker-wait': 'none',
      'execution-time': 'primary',
      'worker-slots': 'primary',
      'rejected-requests': 'primary',
      'worker-starts': 'none',
      'worker-start-time': 'none',
      'requests-by-method': 'none',
      'request-duration': 'none',
    })
  })
})

describe('summarizeChartAvailability', () => {
  const metric = (
    availability: WarehouseMetric['availability'],
    last_sample_at: number | null = null
  ) => createWarehouseMetric('query_rate', { availability, last_sample_at })

  test.each<[string, (WarehouseMetric | undefined)[], boolean, string]>([
    ['all ok with data', [metric('ok'), metric('ok')], true, 'ok'],
    ['partial with data', [metric('ok'), metric('partial')], true, 'partial'],
    ['stale beats partial with data', [metric('partial'), metric('stale')], true, 'stale'],
    [
      'unavailable beats stale with data',
      [metric('stale'), metric('unavailable')],
      true,
      'unavailable',
    ],
    ['missing metric is unavailable', [metric('ok'), undefined], true, 'unavailable'],
    ['no data', [metric('no_data')], false, 'no_data'],
    [
      'insufficient data',
      [metric('no_data'), metric('insufficient_data')],
      false,
      'insufficient_data',
    ],
    ['partial without data counts as no data', [metric('partial')], false, 'no_data'],
    [
      'stale beats insufficient without data',
      [metric('insufficient_data'), metric('stale')],
      false,
      'stale',
    ],
    [
      'unavailable beats stale without data',
      [metric('stale'), metric('unavailable')],
      false,
      'unavailable',
    ],
  ])('%s', (_name, metrics, hasFiniteValues, expected) => {
    expect(summarizeChartAvailability(metrics, hasFiniteValues).status).toBe(expected)
  })

  test('stale carries the newest last sample as ISO', () => {
    const result = summarizeChartAvailability(
      [metric('stale', T0), metric('stale', T0 + 300), metric('ok', T0 + 9999)],
      true
    )
    expect(result).toEqual({
      status: 'stale',
      lastSampleAt: new Date((T0 + 300) * 1000).toISOString(),
    })
  })

  test('stale without a sample time has a null last sample', () => {
    expect(summarizeChartAvailability([metric('stale', null)], false)).toEqual({
      status: 'stale',
      lastSampleAt: null,
    })
  })
})

describe('getWarehouseMetricsPageState', () => {
  const error = new PlatformError({ message: 'boom', code: 500 })
  const second = new PlatformError({ message: 'second', code: 500 })
  const success = (data: WarehouseMetricsResponse) => ({
    status: 'success' as const,
    data,
    error: null,
  })

  test('is ready while requests are pending', () => {
    expect(getWarehouseMetricsPageState([{ status: 'pending', error: null }])).toEqual({
      status: 'ready',
    })
  })

  test('is ready with no results', () => {
    expect(getWarehouseMetricsPageState([])).toEqual({ status: 'ready' })
  })

  test('is not_provisioned when a response has every metric not_provisioned', () => {
    const data = createWarehouseMetricsResponse(['query_rate', 'query_error_rate'], {
      availability: 'not_provisioned',
    })
    expect(
      getWarehouseMetricsPageState([{ status: 'pending', error: null }, success(data)])
    ).toEqual({ status: 'not_provisioned' })
  })

  test('is disabled when a response has every metric disabled', () => {
    const data = createWarehouseMetricsResponse(['query_rate'], { availability: 'disabled' })
    expect(getWarehouseMetricsPageState([success(data)])).toEqual({ status: 'disabled' })
  })

  test('is ready when only some metrics are not_provisioned', () => {
    const data: WarehouseMetricsResponse = {
      metrics: [
        createWarehouseMetric('query_rate', { availability: 'not_provisioned' }),
        createWarehouseMetric('query_error_rate'),
      ],
    }
    expect(getWarehouseMetricsPageState([success(data)])).toEqual({ status: 'ready' })
  })

  test('is all_failed with the first error when every request failed', () => {
    expect(
      getWarehouseMetricsPageState([
        { status: 'error', error },
        { status: 'error', error: second },
      ])
    ).toEqual({ status: 'all_failed', error })
  })

  test('is ready when only some requests failed', () => {
    const data = createWarehouseMetricsResponse(['query_rate'])
    expect(getWarehouseMetricsPageState([{ status: 'error', error }, success(data)])).toEqual({
      status: 'ready',
    })
  })

  test('is ready when a failure is mixed with pending requests', () => {
    expect(
      getWarehouseMetricsPageState([
        { status: 'error', error },
        { status: 'pending', error: null },
      ])
    ).toEqual({ status: 'ready' })
  })
})

describe('getWarehouseMetricsInterval', () => {
  const interval = (hours: number) => {
    const start = '2026-01-01T00:00:00.000Z'
    return getWarehouseMetricsInterval(start, dayjs(start).add(hours, 'hour').toISOString())
  }

  test.each([
    [0.5, '1m'],
    [3, '1m'],
    [3.01, '5m'],
    [24, '5m'],
    [24.5, '30m'],
    [120, '30m'],
    [121, '1h'],
    [24 * 30, '1h'],
  ])('%s hours uses %s', (hours, expected) => {
    expect(interval(hours)).toBe(expected)
  })
})

describe('resolveWarehouseMetricsRange', () => {
  const now = dayjs('2026-11-05T12:34:56.789Z')
  const flooredNow = '2026-11-05T12:34:00.000Z'
  const earliest = '2026-10-06T12:39:00.000Z'

  test('leaves in-range values untouched', () => {
    const start = '2026-11-05T11:34:56.789Z'
    const end = '2026-11-05T12:30:10.000Z'
    expect(resolveWarehouseMetricsRange({ start, end, now })).toEqual({
      status: 'ok',
      startDate: start,
      endDate: end,
      interval: '1m',
      isClamped: false,
    })
  })

  test('normalizes offsets to ISO without marking the range as clamped', () => {
    const result = resolveWarehouseMetricsRange({
      start: '2026-11-05T11:00:00+01:00',
      end: '2026-11-05T11:30:00+01:00',
      now,
    })
    expect(result).toMatchObject({
      status: 'ok',
      startDate: '2026-11-05T10:00:00.000Z',
      endDate: '2026-11-05T10:30:00.000Z',
      isClamped: false,
    })
  })

  test('clamps a start older than 30 days and keeps the end', () => {
    const end = '2026-11-05T12:00:00.000Z'
    expect(resolveWarehouseMetricsRange({ start: '2026-09-01T00:00:00Z', end, now })).toEqual({
      status: 'ok',
      startDate: earliest,
      endDate: end,
      interval: '1h',
      isClamped: true,
    })
  })

  test('clamps an end in the future to the current minute', () => {
    const start = '2026-11-05T11:34:00.000Z'
    expect(resolveWarehouseMetricsRange({ start, end: '2026-11-05T13:00:00Z', now })).toEqual({
      status: 'ok',
      startDate: start,
      endDate: flooredNow,
      interval: '1m',
      isClamped: true,
    })
  })

  test('is out of range when the whole range is older than the window', () => {
    expect(
      resolveWarehouseMetricsRange({
        start: '2026-08-01T00:00:00Z',
        end: '2026-09-01T00:00:00Z',
        now,
      })
    ).toEqual({ status: 'out_of_range' })
  })

  test('is out of range when the whole range is in the future', () => {
    expect(
      resolveWarehouseMetricsRange({
        start: '2026-11-06T00:00:00Z',
        end: '2026-11-07T00:00:00Z',
        now,
      })
    ).toEqual({ status: 'out_of_range' })
  })

  test('is out of range when end is not after start', () => {
    const same = '2026-11-05T10:00:00.000Z'
    expect(resolveWarehouseMetricsRange({ start: same, end: same, now })).toEqual({
      status: 'out_of_range',
    })
  })

  test.each(REPORTS_DATEPICKER_HELPERS.map((helper) => [helper.text, helper] as const))(
    'the "%s" date picker option resolves without clamping',
    (_text, helper) => {
      const result = resolveWarehouseMetricsRange({
        start: helper.calcFrom(),
        end: helper.calcTo(),
      })
      expect(result).toMatchObject({ status: 'ok', isClamped: false })
    }
  )
})
