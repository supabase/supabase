import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  formatDate,
  formatDateTime,
  formatFromNow,
  formatTime,
  resolveTimezone,
  toTimezone,
} from '@/lib/datetime'

// Fixed reference points so the assertions don't depend on the host machine's
// timezone or current wall-clock time.
const SUMMER_UTC = '2025-06-15T12:34:56Z'
const WINTER_UTC = '2025-01-15T12:34:56Z'
// 16-digit unix microseconds equivalent of SUMMER_UTC.
const SUMMER_UNIX_MICRO = '1749990896000000'

describe('formatDateTime', () => {
  it('renders a UTC instant in Asia/Tokyo (UTC+9, no DST)', () => {
    expect(formatDateTime(SUMMER_UTC, { tz: 'Asia/Tokyo' })).toBe('15 Jun 2025 21:34:56')
  })

  it('renders a UTC instant in America/Los_Angeles during DST (UTC-7)', () => {
    expect(formatDateTime(SUMMER_UTC, { tz: 'America/Los_Angeles' })).toBe('15 Jun 2025 05:34:56')
  })

  it('renders a UTC instant in America/Los_Angeles outside DST (UTC-8)', () => {
    expect(formatDateTime(WINTER_UTC, { tz: 'America/Los_Angeles' })).toBe('15 Jan 2025 04:34:56')
  })

  it('flips the wall-clock day when crossing date boundaries', () => {
    const lateUtc = '2025-06-15T22:00:00Z'
    expect(formatDateTime(lateUtc, { tz: 'Asia/Tokyo', format: 'YYYY-MM-DD' })).toBe('2025-06-16')
    expect(formatDateTime(lateUtc, { tz: 'Pacific/Honolulu', format: 'YYYY-MM-DD' })).toBe(
      '2025-06-15'
    )
  })

  it('respects an explicit format string', () => {
    expect(formatDateTime(SUMMER_UTC, { tz: 'UTC', format: 'YYYY-MM-DDTHH:mm:ssZ' })).toBe(
      '2025-06-15T12:34:56+00:00'
    )
  })

  it('accepts unix microsecond timestamps', () => {
    expect(formatDateTime(SUMMER_UNIX_MICRO, { tz: 'UTC' })).toBe('15 Jun 2025 12:34:56')
  })

  it('accepts Date instances', () => {
    expect(formatDateTime(new Date(SUMMER_UTC), { tz: 'UTC' })).toBe('15 Jun 2025 12:34:56')
  })
})

describe('DST transitions in Europe/Berlin', () => {
  it('shows +01:00 before the spring transition', () => {
    expect(formatDateTime('2025-03-30T00:00:00Z', { tz: 'Europe/Berlin', format: 'HH:mm Z' })).toBe(
      '01:00 +01:00'
    )
  })

  it('shows +02:00 after the spring transition', () => {
    expect(formatDateTime('2025-03-30T02:00:00Z', { tz: 'Europe/Berlin', format: 'HH:mm Z' })).toBe(
      '04:00 +02:00'
    )
  })
})

describe('formatDate / formatTime', () => {
  it('formatDate uses the date-only default', () => {
    expect(formatDate(SUMMER_UTC, { tz: 'UTC' })).toBe('15 Jun 2025')
  })

  it('formatTime uses the time-only default', () => {
    expect(formatTime(SUMMER_UTC, { tz: 'UTC' })).toBe('12:34:56')
  })
})

describe('resolveTimezone', () => {
  it('returns the input when it is a valid IANA name', () => {
    expect(resolveTimezone('Asia/Tokyo')).toBe('Asia/Tokyo')
  })

  it('falls back to the guessed local timezone when input is empty', () => {
    expect(resolveTimezone('')).toBeTruthy()
    expect(resolveTimezone(null)).toBeTruthy()
    expect(resolveTimezone(undefined)).toBeTruthy()
  })

  it('falls back when the input is not a real IANA zone', () => {
    // Should not throw, should resolve to something we can format with.
    const tz = resolveTimezone('Not/A/Real_Zone')
    expect(() => formatDateTime(SUMMER_UTC, { tz })).not.toThrow()
  })
})

describe('toTimezone', () => {
  it('returns a Dayjs pinned to the given timezone for chained calls', () => {
    const d = toTimezone(SUMMER_UTC, 'Asia/Tokyo')
    expect(d.format('HH:mm')).toBe('21:34')
    expect(d.hour()).toBe(21)
  })
})

describe('formatFromNow', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T13:34:56Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('renders ISO inputs as a relative duration', () => {
    expect(formatFromNow(SUMMER_UTC)).toBe('an hour ago')
  })

  it('accepts unix microsecond inputs', () => {
    expect(formatFromNow(SUMMER_UNIX_MICRO)).toBe('an hour ago')
  })
})
