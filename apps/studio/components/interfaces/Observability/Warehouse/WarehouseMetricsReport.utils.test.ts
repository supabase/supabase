import { describe, expect, it } from 'vitest'

import {
  getReportStatus,
  getReportView,
  getSetupPrompt,
  hasAnyValues,
  toChartPoints,
} from './WarehouseMetricsReport.utils'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

const makeMetric = (seriesPoints: { timestamp: number; value: number | null }[][]) =>
  ({
    metric: 'query_rate',
    availability: 'available',
    series: seriesPoints.map((points) => ({ points })),
  }) as unknown as WarehouseMetric

describe('getReportView', () => {
  const base = {
    isPlatform: true,
    isLoading: false,
    setupError: null,
    setupPrompt: undefined,
    metricsError: null,
    hasChartValues: true,
  }
  const error = { message: 'boom' }

  it.each([
    ['not on platform', { isPlatform: false, isLoading: true }, 'unsupported'],
    ['loading', { isLoading: true, setupError: error }, 'loading'],
    ['invalid range', { isRangeValid: false, isLoading: true }, 'out-of-range'],
    [
      'setup error',
      { setupError: error, setupPrompt: 'disabled', metricsError: error },
      'setup-error',
    ],
    ['setup prompt', { setupPrompt: 'not_started', metricsError: error }, 'setup'],
    ['metrics error', { metricsError: error }, 'metrics-error'],
    ['ready', {}, 'ready'],
  ] as const)('%s wins over later states', (_, overrides, kind) => {
    expect(getReportView({ ...base, ...overrides }).kind).toBe(kind)
  })
})

describe('getReportStatus', () => {
  it('announces the invalid-range fallback', () => {
    expect(getReportStatus({ kind: 'out-of-range' }, '')).toBe(
      'This period is outside the available metrics history'
    )
  })

  it('announces the empty message when there is nothing to chart', () => {
    const view = getReportView({
      isPlatform: true,
      isLoading: false,
      setupError: null,
      setupPrompt: undefined,
      metricsError: null,
      hasChartValues: false,
    })
    expect(getReportStatus(view, 'No recent data')).toBe('Warehouse report: No recent data')
  })

  it('distinguishes disabled from not set up', () => {
    expect(getReportStatus({ kind: 'setup', prompt: 'disabled' }, '')).toBe('Warehouse is disabled')
    expect(getReportStatus({ kind: 'setup', prompt: 'not_started' }, '')).toBe(
      'Warehouse is not set up'
    )
  })
})

describe('getSetupPrompt', () => {
  it.each([
    ['not_started', false, false, 'not_started'],
    ['disabled', false, false, 'disabled'],
    ['not_started', true, false, undefined],
    ['disabled', false, true, undefined],
    ['enabled', false, false, undefined],
  ] as const)(
    '%s, liveTables=%s, hasValues=%s → %s',
    (setupStatus, hasLiveTables, hasValues, expected) => {
      expect(getSetupPrompt({ setupStatus, hasLiveTables, hasValues })).toBe(expected)
    }
  )
})

describe('toChartPoints / hasAnyValues', () => {
  it('drops non-finite values but keeps the timestamp row', () => {
    const metric = makeMetric([
      [
        { timestamp: 60, value: 1.5 },
        { timestamp: 120, value: null },
        { timestamp: 180, value: Number.NaN },
      ],
    ])
    expect(toChartPoints(metric)).toEqual([
      { timestamp: '1970-01-01T00:01:00.000Z', value: 1.5 },
      { timestamp: '1970-01-01T00:02:00.000Z' },
      { timestamp: '1970-01-01T00:03:00.000Z' },
    ])
  })

  it('only charts a single series, but counts values across all series', () => {
    const metric = makeMetric([[{ timestamp: 60, value: 1 }], [{ timestamp: 60, value: 2 }]])
    expect(toChartPoints(metric)).toEqual([])
    expect(hasAnyValues(metric)).toBe(true)
  })

  it('reports no values for missing or all-null metrics', () => {
    expect(hasAnyValues(undefined)).toBe(false)
    expect(hasAnyValues(makeMetric([[{ timestamp: 60, value: null }]]))).toBe(false)
  })
})
