import { describe, expect, it } from 'vitest'

import {
  getDefaultChartInterval,
  isChartIntervalKey,
  resolveChartInterval,
} from './ChartInterval.utils'

describe('isChartIntervalKey', () => {
  it('accepts known keys only', () => {
    expect(isChartIntervalKey('1hr')).toBe(true)
    expect(isChartIntervalKey('1day')).toBe(true)
    expect(isChartIntervalKey('7day')).toBe(true)
    expect(isChartIntervalKey('30day')).toBe(false)
    expect(isChartIntervalKey(undefined)).toBe(false)
    expect(isChartIntervalKey(1)).toBe(false)
  })
})

describe('getDefaultChartInterval', () => {
  it('uses 1hr when retention is under 7 days', () => {
    expect(getDefaultChartInterval(1)).toBe('1hr')
  })

  it('uses 1day when retention is 7+ days or unknown', () => {
    expect(getDefaultChartInterval(7)).toBe('1day')
    expect(getDefaultChartInterval(undefined)).toBe('1day')
  })
})

describe('resolveChartInterval', () => {
  it('returns the stored interval when allowed by retention', () => {
    expect(resolveChartInterval('7day', 7)).toBe('7day')
    expect(resolveChartInterval('1hr', 7)).toBe('1hr')
  })

  it('returns the stored interval while retention is still loading', () => {
    expect(resolveChartInterval('7day', undefined)).toBe('7day')
  })

  it('falls back to the default when nothing is stored', () => {
    expect(resolveChartInterval(undefined, 7)).toBe('1day')
    expect(resolveChartInterval(undefined, 1)).toBe('1hr')
  })

  it('falls back to the default when the stored value is invalid', () => {
    expect(resolveChartInterval('bogus', 7)).toBe('1day')
    expect(resolveChartInterval(42, 1)).toBe('1hr')
  })

  it('falls back to the default when the plan no longer allows the stored interval', () => {
    expect(resolveChartInterval('7day', 1)).toBe('1hr')
    expect(resolveChartInterval('1day', 0.5)).toBe('1hr')
  })
})
