import { describe, expect, it } from 'vitest'

import {
  formatTimestamptzDisplay,
  isTimestamptzColumnFormat,
  TABLE_EDITOR_TIMESTAMPTZ_FORMAT,
} from './TimestampFormatter.utils'

describe('isTimestamptzColumnFormat', () => {
  it('matches timestamptz formats', () => {
    expect(isTimestamptzColumnFormat('timestamptz')).toBe(true)
    expect(isTimestamptzColumnFormat('TIMESTAMPTZ')).toBe(true)
    expect(isTimestamptzColumnFormat('timestamp with time zone')).toBe(true)
  })

  it('rejects timestamp-without-time-zone and other types', () => {
    expect(isTimestamptzColumnFormat('timestamp')).toBe(false)
    expect(isTimestamptzColumnFormat('timestamp without time zone')).toBe(false)
    expect(isTimestamptzColumnFormat('date')).toBe(false)
    expect(isTimestamptzColumnFormat('timetz')).toBe(false)
    expect(isTimestamptzColumnFormat('')).toBe(false)
    expect(isTimestamptzColumnFormat(undefined)).toBe(false)
    expect(isTimestamptzColumnFormat(null)).toBe(false)
  })
})

describe('formatTimestamptzDisplay', () => {
  it('renders a UTC timestamptz in Asia/Seoul with the offset', () => {
    expect(formatTimestamptzDisplay('2026-06-12 07:00:01+00', 'Asia/Seoul')).toBe(
      '2026-06-12 16:00:01+09:00'
    )
  })

  it('keeps UTC values in UTC when that timezone is selected', () => {
    expect(formatTimestamptzDisplay('2026-06-12 07:00:01+00', 'UTC')).toBe(
      '2026-06-12 07:00:01+00:00'
    )
  })

  it('accepts ISO-8601 values with a Z suffix', () => {
    expect(formatTimestamptzDisplay('2026-06-12T07:00:01Z', 'Asia/Seoul')).toBe(
      '2026-06-12 16:00:01+09:00'
    )
  })

  it('accepts compact offsets such as +0000', () => {
    expect(formatTimestamptzDisplay('2026-06-12 07:00:01+0000', 'Asia/Seoul')).toBe(
      '2026-06-12 16:00:01+09:00'
    )
  })

  it('preserves fractional seconds by rounding to the display format', () => {
    expect(formatTimestamptzDisplay('2026-06-12 07:00:01.123456+00', 'UTC')).toBe(
      '2026-06-12 07:00:01+00:00'
    )
  })

  it('flips the calendar day when the offset crosses midnight', () => {
    expect(formatTimestamptzDisplay('2026-06-12 22:00:00+00', 'Asia/Seoul')).toBe(
      '2026-06-13 07:00:00+09:00'
    )
  })

  it('renders America/Los_Angeles during daylight saving time', () => {
    expect(formatTimestamptzDisplay('2026-06-12 07:00:01+00', 'America/Los_Angeles')).toBe(
      '2026-06-12 00:00:01-07:00'
    )
  })

  it('returns null for SQL NULL', () => {
    expect(formatTimestamptzDisplay(null, 'UTC')).toBeNull()
    expect(formatTimestamptzDisplay(undefined, 'UTC')).toBeNull()
  })

  it('returns an empty string for empty values', () => {
    expect(formatTimestamptzDisplay('', 'UTC')).toBe('')
  })

  it('returns the original value when the timestamp cannot be parsed', () => {
    expect(formatTimestamptzDisplay('not-a-timestamp', 'UTC')).toBe('not-a-timestamp')
  })

  it('stringifies unexpected object values', () => {
    expect(formatTimestamptzDisplay({ iso: '2026-06-12' }, 'UTC')).toBe('[object Object]')
  })

  it('exports the display format used by the Table Editor', () => {
    expect(TABLE_EDITOR_TIMESTAMPTZ_FORMAT).toBe('YYYY-MM-DD HH:mm:ssZ')
  })
})
