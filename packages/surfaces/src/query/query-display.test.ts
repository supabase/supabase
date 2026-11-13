import { describe, expect, it } from 'vitest'

import type { ChartConfig } from '../contract'
import {
  chartRowsForSource,
  parseChartTimestamp,
  prepareChart,
  QueryDisplayState,
} from './query-display'

const chart: ChartConfig = {
  type: 'bar',
  x_column: 'day',
  y_series: ['revenue'],
  cumulative: false,
  scale: 'linear',
  show_labels: true,
}

describe('QueryDisplayState', () => {
  it('keeps chart settings when the user switches to the table and back', () => {
    const state = new QueryDisplayState({ view: 'chart', chart })
    state.change({ view: 'table' }, 0)
    expect(state.display.chart).toEqual(chart)
    state.change({ view: 'chart' }, 1)
    expect(state.display.chart).toEqual(chart)
    expect(state.revision).toBe(2)
  })

  it('rejects a display change based on an outdated revision', () => {
    const state = new QueryDisplayState({ view: 'chart', chart })
    state.change({ view: 'table' }, 0)
    expect(() => state.change({ view: 'chart' }, 0)).toThrow('display changed')
  })

  it('does not advance the revision for a change that changes nothing', () => {
    const state = new QueryDisplayState({ view: 'chart', chart })
    state.change({ view: 'chart' }, 0)
    expect(state.revision).toBe(0)
  })

  it('refuses display fields outside the contract', () => {
    expect(
      () => new QueryDisplayState({ view: 'chart', chart, ...{ script: 'alert(1)' } })
    ).toThrow()
  })
})

describe('prepareChart', () => {
  it('sums Postgres numeric strings per series without mutating the results', () => {
    const rows = [
      { day: 'Mon', revenue: '10', orders: 2 },
      { day: 'Tue', revenue: '20', orders: 3 },
    ]
    const prepared = prepareChart(rows, {
      ...chart,
      cumulative: true,
      y_series: ['revenue', 'orders'],
    })
    expect(prepared.data).toEqual([
      { x_value: 'Mon', series_0: 10, series_1: 2 },
      { x_value: 'Tue', series_0: 30, series_1: 5 },
    ])
    expect(rows[1].revenue).toBe('20')
  })

  it('keys series by position so column names cannot collide or become property paths', () => {
    const prepared = prepareChart([{ series_0: 'x', 'a.b[0]': '12', '</style>': 7 }], {
      ...chart,
      x_column: 'series_0',
      y_series: ['a.b[0]', '</style>'],
    })
    expect(prepared.data).toEqual([{ x_value: 'x', series_0: 12, series_1: 7 }])
    expect(prepared.series[1].label).toBe('</style>')
  })

  it('treats non-numeric values as gaps, and as zero when accumulating like Studio', () => {
    const rows = [null, '', 'abc', Infinity, {}, true, '0.5'].map((revenue) => ({
      day: 'd',
      revenue,
    }))
    expect(prepareChart(rows, chart).data.map((row) => row.series_0)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      0.5,
    ])
    expect(prepareChart(rows, { ...chart, cumulative: true }).data.at(-1)?.series_0).toBe(0.5)
  })

  it('falls back to a linear scale unless one positive numeric series is plotted', () => {
    expect(prepareChart([{ day: 'd', revenue: '0.01' }], { ...chart, scale: 'log' }).scale).toBe(
      'log'
    )
    for (const revenue of [0, -1, null, 'no', Infinity]) {
      expect(prepareChart([{ day: 'd', revenue }], { ...chart, scale: 'log' }).scale).toBe('linear')
    }
    const twoSeries = prepareChart([{ day: 'd', revenue: 1, orders: 2 }], {
      ...chart,
      scale: 'log',
      y_series: ['revenue', 'orders'],
    })
    expect(twoSeries.scale).toBe('linear')
    expect(twoSeries.logDisabledReason).toBe('Log scale requires a single Y axis column.')
  })

  it('reports missing columns rather than silently plotting unrelated data', () => {
    expect(prepareChart([{ day: 'd', other: 4 }], chart).missing).toEqual(['revenue'])
  })

  it('reports when no Y value is numeric, so the chart can explain instead of drawing nothing', () => {
    expect(prepareChart([{ day: 'd', revenue: 'n/a' }], chart).hasValues).toBe(false)
    expect(prepareChart([{ day: 'd', revenue: 3 }], chart).hasValues).toBe(true)
  })
})

describe('log timestamps', () => {
  it('reads ClickHouse timestamps without a timezone suffix as UTC', () => {
    expect(parseChartTimestamp('2026-10-23T02:30:00', true).toISOString()).toBe(
      '2026-10-23T02:30:00.000Z'
    )
    expect(parseChartTimestamp('2026-10-23 02:30:00.123456', true).toISOString()).toBe(
      '2026-10-23T02:30:00.123Z'
    )
    expect(parseChartTimestamp('2026-10-23T12:30:00+10:00', true).toISOString()).toBe(
      '2026-10-23T02:30:00.000Z'
    )
  })

  it('rewrites only log X-axis timestamps for the chart, leaving database rows alone', () => {
    const rows = [{ timestamp: '2026-10-23 02:30:00', count: 1 }]
    const timestampChart = { ...chart, x_column: 'timestamp' }
    expect(chartRowsForSource(rows, timestampChart, 'logs')).toEqual([
      { timestamp: '2026-10-23T02:30:00.000Z', count: 1 },
    ])
    expect(chartRowsForSource(rows, timestampChart, 'database')).toEqual(rows)
    expect(chartRowsForSource([{ timestamp: 5 }], timestampChart, 'logs')).toEqual([
      { timestamp: 5 },
    ])
  })
})
