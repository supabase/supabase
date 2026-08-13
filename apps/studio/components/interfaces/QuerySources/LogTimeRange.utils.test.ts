import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  customDateRangeToLogTimeRange,
  datePickerValueToLogTimeRange,
  logTimeRangesEqual,
  logTimeRangeToDatePickerValue,
  resolveLogTimeRange,
} from './LogTimeRange.utils'
import { generateDynamicHelper } from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import {
  DEFAULT_LOG_TIME_RANGE,
  type LogTimeRange,
} from '@/data/query-sources/query-source-registry'

describe('LogTimeRange.utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-08T12:00:00.000Z'))
  })

  afterEach(() => vi.useRealTimers())

  it.each([
    ['30m', 30, 'minute'],
    ['2h', 2, 'hour'],
    ['7d', 7, 'day'],
    ['2w', 2, 'week'],
  ] as const)('round-trips the picker helper for %s', (_, amount, unit) => {
    const helper = generateDynamicHelper(amount, unit)
    const pickerValue = {
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    }
    const range: LogTimeRange = { type: 'relative', amount, unit }

    expect(datePickerValueToLogTimeRange(pickerValue)).toEqual(range)
    expect(logTimeRangeToDatePickerValue(range)).toEqual(pickerValue)
  })

  it('falls back to the default when a custom value has no valid start', () => {
    expect(datePickerValueToLogTimeRange({ from: '', to: '', isHelper: false })).toEqual(
      DEFAULT_LOG_TIME_RANGE
    )
  })

  it('uses now when an absolute helper has an empty end', () => {
    expect(
      datePickerValueToLogTimeRange({
        from: '2025-01-01T00:00:00.000Z',
        to: '',
        isHelper: true,
        text: 'Custom',
      })
    ).toEqual({
      type: 'absolute',
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-01-08T12:00:00.000Z',
    })
  })

  it('compares relative and absolute ranges structurally', () => {
    expect(
      logTimeRangesEqual(
        { type: 'relative', amount: 1, unit: 'hour' },
        { type: 'relative', amount: 1, unit: 'hour' }
      )
    ).toBe(true)
    expect(
      logTimeRangesEqual(
        { type: 'relative', amount: 1, unit: 'hour' },
        { type: 'relative', amount: 1, unit: 'day' }
      )
    ).toBe(false)
    expect(
      logTimeRangesEqual(
        { type: 'absolute', from: '2025-01-01T00:00:00.000Z', to: '2025-01-02T00:00:00.000Z' },
        { type: 'absolute', from: '2025-01-01T00:00:00.000Z', to: '2025-01-02T00:00:00.000Z' }
      )
    ).toBe(true)
  })

  it('resolves a relative range against the current time', () => {
    expect(resolveLogTimeRange({ type: 'relative', amount: 2, unit: 'week' })).toEqual({
      from: dayjs().subtract(2, 'week').toISOString(),
      to: dayjs().toISOString(),
    })
  })

  it('passes an absolute range through unchanged', () => {
    const range: LogTimeRange = {
      type: 'absolute',
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-01-02T00:00:00.000Z',
    }
    expect(resolveLogTimeRange(range)).toEqual({ from: range.from, to: range.to })
  })

  it('clamps a custom range ending today to now', () => {
    const from = new Date('2025-01-07T09:00:00.000Z')
    expect(
      customDateRangeToLogTimeRange({
        from,
        to: new Date('2025-01-08T09:00:00.000Z'),
      })
    ).toEqual({
      type: 'absolute',
      from: dayjs(from).startOf('day').toISOString(),
      to: '2025-01-08T12:00:00.000Z',
    })
  })
})
