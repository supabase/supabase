import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { describe, expect, it } from 'vitest'

import { formatTimestamp, safeDecodeURIComponent } from './Reports.utils'

dayjs.extend(utc)

describe('safeDecodeURIComponent', () => {
  it('decodes a valid percent-encoded string', () => {
    expect(safeDecodeURIComponent('a%20b')).toBe('a b')
  })

  it('returns the original string when percent-encoding is malformed', () => {
    expect(safeDecodeURIComponent('?discount=100%')).toBe('?discount=100%')
  })

  it('handles an empty string', () => {
    expect(safeDecodeURIComponent('')).toBe('')
  })
})

describe('formatTimestamp', () => {
  it('formats milliseconds timestamp correctly', () => {
    const timestamp = 1640995200000 // 2022-01-01 00:00:00 UTC in milliseconds
    const result = formatTimestamp(timestamp, { returnUtc: true })
    expect(result).toBe('Jan 1, 12:00am')
  })

  it('formats microseconds timestamp correctly', () => {
    const timestamp = 1640995200000000 // 2022-01-01 00:00:00 UTC in microseconds
    const result = formatTimestamp(timestamp, { returnUtc: true })
    expect(result).toBe('Jan 1, 12:00am')
  })

  it('formats seconds timestamp correctly', () => {
    const timestamp = 1640995200 // 2022-01-01 00:00:00 UTC in seconds
    const result = formatTimestamp(timestamp, { returnUtc: true })
    expect(result).toBe('Jan 1, 12:00am')
  })

  it('handles string timestamp input', () => {
    const timestamp = '1640995200000'
    const result = formatTimestamp(timestamp, { returnUtc: true })
    expect(result).toBe('Jan 1, 12:00am')
  })

  it('handles invalid string timestamp', () => {
    const timestamp = 'invalid-timestamp'
    const result = formatTimestamp(timestamp, { returnUtc: true })
    expect(result).toBe('Invalid Date')
  })

  it('handles zero timestamp', () => {
    const timestamp = 0
    const result = formatTimestamp(timestamp, { returnUtc: true })
    expect(result).toBe('Jan 1, 12:00am')
  })
})
