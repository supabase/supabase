import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { toCalendarDate, withCalendarDate, withTime } from './PITR.utils'

describe('toCalendarDate', () => {
  it('hands the calendar the day as seen in the selected timezone', () => {
    // 02:30 UTC is still the previous day in every negative offset, so a
    // browser-local conversion here would show the wrong day in the calendar
    const selected = dayjs.tz('2026-08-10 02:30:00', 'UTC')
    const calendarDate = toCalendarDate(selected)

    expect(calendarDate.getFullYear()).toBe(2026)
    expect(calendarDate.getMonth()).toBe(7)
    expect(calendarDate.getDate()).toBe(10)
    expect(calendarDate.getHours()).toBe(0)
  })
})

describe('withCalendarDate', () => {
  it('keeps the time of day when the calendar date changes', () => {
    const current = dayjs.tz('2026-08-10 02:30:15', 'UTC')
    const updated = withCalendarDate(current, new Date(2026, 7, 3), 'UTC')

    expect(updated.tz('UTC').format('YYYY-MM-DD HH:mm:ss')).toBe('2026-08-03 02:30:15')
  })

  it('resolves the wall clock against the offset in effect on the new date', () => {
    const current = dayjs.tz('2026-03-20 12:00:00', 'America/New_York')
    const updated = withCalendarDate(current, new Date(2026, 1, 20), 'America/New_York')

    expect(updated.format('Z')).toBe('-05:00')
    expect(updated.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss')).toBe('2026-02-20 12:00:00')
  })

  it('does not overflow when the new month is shorter than the current one', () => {
    const current = dayjs.tz('2026-01-31 08:00:00', 'UTC')
    const updated = withCalendarDate(current, new Date(2026, 1, 28), 'UTC')

    expect(updated.tz('UTC').format('YYYY-MM-DD HH:mm:ss')).toBe('2026-02-28 08:00:00')
  })
})

describe('withTime', () => {
  it('sets the wall clock in the timezone the date is rendered in', () => {
    const current = dayjs.unix(1786000000).tz('Asia/Tokyo')
    const updated = withTime(current, { h: 1, m: 2, s: 3 })

    expect(updated.format('YYYY-MM-DD HH:mm:ss')).toBe(`${current.format('YYYY-MM-DD')} 01:02:03`)
    expect(updated.utc().format('HH:mm:ss')).toBe('16:02:03')
  })
})
