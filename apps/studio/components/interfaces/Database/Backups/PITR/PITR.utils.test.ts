import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { getRestoreDate, updateRestoreDate } from './PITR.utils'

describe('restore date editing', () => {
  test('normalizes a nonexistent spring-forward time using the existing timezone behavior', () => {
    const current = getRestoreDate(dayjs('2026-03-28T01:30:00Z').unix(), 'Europe/Madrid')
    const updated = updateRestoreDate(current, '2026-03-29', { h: 2, m: 30, s: 0 }, 'Europe/Madrid')
    expect(updated.toISOString()).toBe('2026-03-29T01:30:00.000Z')
    expect(updated.format('HH:mm')).toBe('03:30')
  })

  test.each([
    ['Europe/Madrid', '2026-10-25T00:30:00Z', '2026-10-25', 2, '2026-10-25T00:35:17Z'],
    ['Europe/Madrid', '2026-10-25T01:30:00Z', '2026-10-25', 2, '2026-10-25T01:35:17Z'],
    ['America/New_York', '2026-11-01T05:30:00Z', '2026-11-01', 1, '2026-11-01T05:35:17Z'],
    ['America/New_York', '2026-11-01T06:30:00Z', '2026-11-01', 1, '2026-11-01T06:35:17Z'],
  ])('preserves repeated hour occurrence in %s at %s', (timezone, instant, date, h, expected) => {
    const current = getRestoreDate(dayjs(instant).unix(), timezone)
    const updated = updateRestoreDate(current, date, { h, m: 35, s: 17 }, timezone)
    expect(updated.toISOString()).toBe(dayjs(expected).toISOString())
  })

  test.each([
    ['2026-10-26T09:15:30Z', '2026-10-24', '2026-10-24T08:15:30Z'],
    ['2026-10-24T08:15:30Z', '2026-10-26', '2026-10-26T09:15:30Z'],
  ])('retains the entered time across daylight saving at %s', (instant, date, expected) => {
    const current = getRestoreDate(dayjs(instant).unix(), 'Europe/Madrid')
    expect(
      updateRestoreDate(current, date, { h: 10, m: 15, s: 30 }, 'Europe/Madrid').toISOString()
    ).toBe(dayjs(expected).toISOString())
  })

  test('leaves the repeated hour using the offset for the new time', () => {
    const current = getRestoreDate(dayjs('2026-10-25T00:30:00Z').unix(), 'Europe/Madrid')
    expect(
      updateRestoreDate(current, '2026-10-25', { h: 3, m: 30, s: 0 }, 'Europe/Madrid').toISOString()
    ).toBe('2026-10-25T02:30:00.000Z')
  })

  test('retains fractional timezone offsets', () => {
    const current = getRestoreDate(dayjs('2026-10-24T08:30:00Z').unix(), 'Asia/Kathmandu')
    expect(current.format('HH:mm')).toBe('14:15')
    expect(
      updateRestoreDate(
        current,
        '2026-10-23',
        { h: 14, m: 15, s: 0 },
        'Asia/Kathmandu'
      ).toISOString()
    ).toBe('2026-10-23T08:30:00.000Z')
  })
})
