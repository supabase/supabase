import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  datePickerValueToLogDateRange,
  DEFAULT_LOG_DATE_RANGE,
  getSnippetSource,
  isoDateTimeString,
  logDateRangesEqual,
  logDateRangeToDatePickerValue,
  resolveLogRunRange,
  type LogDateRange,
} from './querySource'
import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from '@/components/interfaces/Settings/Logs/Logs.constants'
import { generateHelpersFromInput } from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { DatetimeHelper } from '@/components/interfaces/Settings/Logs/Logs.types'

/** Build the `DatePickerValue` the Logs picker submits when a helper is selected. */
const valueFromHelper = (helper: DatetimeHelper): DatePickerValue => ({
  from: helper.calcFrom(),
  to: helper.calcTo(),
  isHelper: true,
  text: helper.text,
})

/** The single dynamic helper produced from typed input like "2h" / "30m". */
const dynamicHelper = (input: string): DatetimeHelper => {
  const generated = generateHelpersFromInput(input)
  if (!generated || generated.length !== 1) {
    throw new Error(`Expected a single dynamic helper for "${input}"`)
  }
  return generated[0]
}

describe('querySource.ts:getSnippetSource', () => {
  it('maps log_sql to the logs source', () => {
    expect(getSnippetSource({ type: 'log_sql' })).toBe('logs')
  })

  it('maps sql to the database source', () => {
    expect(getSnippetSource({ type: 'sql' })).toBe('database')
  })

  it('maps report to the database source', () => {
    expect(getSnippetSource({ type: 'report' })).toBe('database')
  })
})

describe('querySource.ts:isoDateTimeString', () => {
  it('accepts a valid ISO datetime', () => {
    const raw = '2025-01-01T12:00:00.000Z'
    expect(isoDateTimeString(raw)).toBe(raw)
  })

  it('rejects an empty string', () => {
    expect(isoDateTimeString('')).toBeNull()
  })

  it('rejects junk', () => {
    expect(isoDateTimeString('not-a-date')).toBeNull()
    expect(isoDateTimeString('2025-13-45T99:99:99Z')).toBeNull()
  })
})

describe('querySource.ts:datePickerValueToLogDateRange', () => {
  it('parses every static preset into a relative range', () => {
    const cases: Array<[string, { amount: number; unit: 'minute' | 'hour' | 'day' }]> = [
      ['Last hour', { amount: 1, unit: 'hour' }],
      ['Last 3 hours', { amount: 3, unit: 'hour' }],
      ['Last 24 hours', { amount: 24, unit: 'hour' }],
      ['Last 3 days', { amount: 3, unit: 'day' }],
      ['Last 7 days', { amount: 7, unit: 'day' }],
    ]

    for (const [text, last] of cases) {
      const helper = EXPLORER_DATEPICKER_HELPERS.find((h) => h.text === text)
      expect(helper, `preset "${text}" exists`).toBeDefined()
      expect(datePickerValueToLogDateRange(valueFromHelper(helper!))).toEqual({
        kind: 'relative',
        last,
      })
    }
  })

  it('parses dynamic helpers ("2h", "30m", "7d") into relative ranges', () => {
    expect(datePickerValueToLogDateRange(valueFromHelper(dynamicHelper('2h')))).toEqual({
      kind: 'relative',
      last: { amount: 2, unit: 'hour' },
    })
    expect(datePickerValueToLogDateRange(valueFromHelper(dynamicHelper('30m')))).toEqual({
      kind: 'relative',
      last: { amount: 30, unit: 'minute' },
    })
    expect(datePickerValueToLogDateRange(valueFromHelper(dynamicHelper('7d')))).toEqual({
      kind: 'relative',
      last: { amount: 7, unit: 'day' },
    })
  })

  it('treats a preset (calcTo() === "") as relative — the empty end means "now"', () => {
    const lastHour = getDefaultHelper(EXPLORER_DATEPICKER_HELPERS)
    const value = valueFromHelper(lastHour)
    expect(value.to).toBe('')
    expect(datePickerValueToLogDateRange(value)).toEqual({
      kind: 'relative',
      last: { amount: 1, unit: 'hour' },
    })
  })

  it('degrades an unparseable helper to an absolute range using from/now (never empty)', () => {
    vi.useFakeTimers()
    const now = new Date('2025-01-01T12:00:00.000Z')
    vi.setSystemTime(now)

    const from = '2024-12-31T00:00:00.000Z'
    const result = datePickerValueToLogDateRange({
      from,
      to: '',
      isHelper: true,
      text: 'Some custom label',
    })

    expect(result).toEqual({
      kind: 'absolute',
      from,
      to: dayjs(now).toISOString(),
    })
  })

  it('maps a custom (non-helper) pick to an absolute range with both endpoints', () => {
    const from = '2025-01-01T00:00:00.000Z'
    const to = '2025-01-02T00:00:00.000Z'
    expect(datePickerValueToLogDateRange({ from, to, isHelper: false })).toEqual({
      kind: 'absolute',
      from,
      to,
    })
  })

  it('falls back to the default range when the value has no usable from', () => {
    expect(datePickerValueToLogDateRange({ from: '', to: '', isHelper: false })).toEqual(
      DEFAULT_LOG_DATE_RANGE
    )
  })
})

describe('querySource.ts:logDateRangeToDatePickerValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'))
  })

  it('renders a relative range exactly as the picker would emit the helper', () => {
    const value = logDateRangeToDatePickerValue({
      kind: 'relative',
      last: { amount: 1, unit: 'hour' },
    })
    expect(value).toEqual({
      from: dayjs().subtract(1, 'hour').toISOString(),
      to: dayjs().toISOString(),
      isHelper: true,
      text: 'Last 1 hour',
    })
  })

  it('pluralizes the label for amounts greater than one', () => {
    expect(
      logDateRangeToDatePickerValue({ kind: 'relative', last: { amount: 3, unit: 'day' } }).text
    ).toBe('Last 3 days')
  })

  it('round-trips through datePickerValueToLogDateRange', () => {
    const range: LogDateRange = { kind: 'relative', last: { amount: 30, unit: 'minute' } }
    expect(datePickerValueToLogDateRange(logDateRangeToDatePickerValue(range))).toEqual(range)
  })

  it('passes an absolute range through as a non-helper value', () => {
    const range: LogDateRange = {
      kind: 'absolute',
      from: isoDateTimeString('2025-01-01T00:00:00.000Z')!,
      to: isoDateTimeString('2025-01-02T00:00:00.000Z')!,
    }
    expect(logDateRangeToDatePickerValue(range)).toEqual({
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-01-02T00:00:00.000Z',
      isHelper: false,
    })
  })
})

describe('querySource.ts:resolveLogRunRange', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('re-resolves a relative range against the current time', () => {
    vi.useFakeTimers()
    const now = new Date('2025-06-15T08:30:00.000Z')
    vi.setSystemTime(now)

    expect(resolveLogRunRange({ kind: 'relative', last: { amount: 2, unit: 'hour' } })).toEqual({
      from: dayjs(now).subtract(2, 'hour').toISOString(),
      to: dayjs(now).toISOString(),
    })
  })

  it('re-resolves the same relative range differently as time advances', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T08:00:00.000Z'))
    const first = resolveLogRunRange({ kind: 'relative', last: { amount: 1, unit: 'hour' } })

    vi.setSystemTime(new Date('2025-06-15T10:00:00.000Z'))
    const second = resolveLogRunRange({ kind: 'relative', last: { amount: 1, unit: 'hour' } })

    expect(first).not.toEqual(second)
    expect(second.to).toBe(dayjs('2025-06-15T10:00:00.000Z').toISOString())
  })

  it('passes an absolute range through unchanged', () => {
    const from = isoDateTimeString('2025-01-01T00:00:00.000Z')!
    const to = isoDateTimeString('2025-01-02T00:00:00.000Z')!
    expect(resolveLogRunRange({ kind: 'absolute', from, to })).toEqual({
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-01-02T00:00:00.000Z',
    })
  })
})

describe('querySource.ts:logDateRangesEqual', () => {
  it('matches relative ranges on amount + unit regardless of label formatting', () => {
    const lastHourPreset = EXPLORER_DATEPICKER_HELPERS.find((h) => h.text === 'Last hour')!
    const presetRange = datePickerValueToLogDateRange({
      from: lastHourPreset.calcFrom(),
      to: lastHourPreset.calcTo(),
      isHelper: true,
      text: lastHourPreset.text,
    })

    expect(
      logDateRangesEqual(presetRange, { kind: 'relative', last: { amount: 1, unit: 'hour' } })
    ).toBe(true)
  })

  it('does not match relative ranges with a different amount or unit', () => {
    expect(
      logDateRangesEqual(
        { kind: 'relative', last: { amount: 1, unit: 'hour' } },
        { kind: 'relative', last: { amount: 3, unit: 'hour' } }
      )
    ).toBe(false)
    expect(
      logDateRangesEqual(
        { kind: 'relative', last: { amount: 1, unit: 'hour' } },
        { kind: 'relative', last: { amount: 1, unit: 'day' } }
      )
    ).toBe(false)
  })

  it('matches absolute ranges on their ISO endpoints', () => {
    const from = isoDateTimeString('2025-01-01T00:00:00.000Z')!
    const to = isoDateTimeString('2025-01-02T00:00:00.000Z')!
    expect(logDateRangesEqual({ kind: 'absolute', from, to }, { kind: 'absolute', from, to })).toBe(
      true
    )
  })

  it('never matches a relative range against an absolute one', () => {
    const from = isoDateTimeString('2025-01-01T00:00:00.000Z')!
    const to = isoDateTimeString('2025-01-02T00:00:00.000Z')!
    expect(
      logDateRangesEqual(
        { kind: 'relative', last: { amount: 1, unit: 'hour' } },
        {
          kind: 'absolute',
          from,
          to,
        }
      )
    ).toBe(false)
  })
})
