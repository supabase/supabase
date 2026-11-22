import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { describe, expect, it } from 'vitest'

import { formatTimestamp, getStatusClassCounts, safeDecodeURIComponent } from './Reports.utils'

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

describe('getStatusClassCounts', () => {
  it('sums 4xx as warnings and 5xx as errors across rows', () => {
    const rows = [
      { timestamp: '2026-07-28T09:00:00.000Z', '200': 10, '404': 2, '500': 1 },
      { timestamp: '2026-07-28T09:01:00.000Z', '200': 5, '400': 3, '502': 4, '520': 1 },
    ]

    expect(getStatusClassCounts(rows)).toEqual({ warnings: 5, errors: 6 })
  })

  it('ignores 1xx, 2xx and 3xx codes, the timestamp, and non-numeric values', () => {
    const rows = [{ timestamp: '2026-07-28T09:00:00.000Z', '200': 7, '301': 2, '404': 'n/a' }]

    expect(getStatusClassCounts(rows)).toEqual({ warnings: 0, errors: 0 })
  })

  it('returns zero counts when there are no rows', () => {
    expect(getStatusClassCounts([])).toEqual({ warnings: 0, errors: 0 })
  })
})
