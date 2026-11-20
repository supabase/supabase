import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { getWarehouseMetricsInterval, resolveWarehouseMetricsRange } from './WarehouseMetrics.range'
import { REPORTS_DATEPICKER_HELPERS } from '@/components/interfaces/Reports/Reports.constants'

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
