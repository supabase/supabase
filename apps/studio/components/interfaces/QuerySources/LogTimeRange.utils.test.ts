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
import { timeRangeSchema, type TimeRange } from '@/data/content/notebooks/notebook-schema'
import { DEFAULT_LOG_TIME_RANGE } from '@/data/query-sources/query-source-registry'

/** Absolute bounds are branded ISO strings, so build them through the schema. */
const absolute = (start: string, end: string): TimeRange =>
  timeRangeSchema.parse({ _tag: 'absolute_time_range', start, end })

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
  ] as const)('round-trips the picker helper for %s', (_, amount, unit) => {
    const helper = generateDynamicHelper(amount, unit)
    const pickerValue = {
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    }
    const range: TimeRange = { _tag: 'relative_time_range', amount, unit }

    expect(datePickerValueToLogTimeRange(pickerValue)).toEqual(range)
    expect(logTimeRangeToDatePickerValue(range)).toEqual(pickerValue)
  })

  it('renders a relative unit the picker has no preset for as a resolved absolute range', () => {
    expect(
      logTimeRangeToDatePickerValue({ _tag: 'relative_time_range', amount: 2, unit: 'month' })
    ).toEqual({
      from: dayjs().subtract(2, 'month').toISOString(),
      to: dayjs().toISOString(),
      isHelper: false,
    })
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
      _tag: 'absolute_time_range',
      start: '2025-01-01T00:00:00.000Z',
      end: '2025-01-08T12:00:00.000Z',
    })
  })

  it('compares relative and absolute ranges structurally', () => {
    expect(
      logTimeRangesEqual(
        { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
        { _tag: 'relative_time_range', amount: 1, unit: 'hour' }
      )
    ).toBe(true)
    expect(
      logTimeRangesEqual(
        { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
        { _tag: 'relative_time_range', amount: 1, unit: 'day' }
      )
    ).toBe(false)
    expect(
      logTimeRangesEqual(
        absolute('2025-01-01T00:00:00.000Z', '2025-01-02T00:00:00.000Z'),
        absolute('2025-01-01T00:00:00.000Z', '2025-01-02T00:00:00.000Z')
      )
    ).toBe(true)
  })

  it('resolves a relative range against the current time', () => {
    expect(resolveLogTimeRange({ _tag: 'relative_time_range', amount: 2, unit: 'day' })).toEqual({
      from: dayjs().subtract(2, 'day').toISOString(),
      to: dayjs().toISOString(),
    })
  })

  it('passes an absolute range through unchanged', () => {
    const range = absolute('2025-01-01T00:00:00.000Z', '2025-01-02T00:00:00.000Z')
    expect(resolveLogTimeRange(range)).toEqual({
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-01-02T00:00:00.000Z',
    })
  })

  it('clamps a custom range ending today to now', () => {
    const from = new Date('2025-01-07T09:00:00.000Z')
    expect(
      customDateRangeToLogTimeRange({
        from,
        to: new Date('2025-01-08T09:00:00.000Z'),
      })
    ).toEqual({
      _tag: 'absolute_time_range',
      start: dayjs(from).startOf('day').toISOString(),
      end: '2025-01-08T12:00:00.000Z',
    })
  })
})
