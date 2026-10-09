import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { ALL_TIMEZONES } from '@/components/interfaces/Database/Backups/PITR/PITR.constants'
import { getTimezoneLabel } from '@/components/interfaces/Database/Backups/PITR/PITR.utils'

const getTimezone = (zone: string) => {
  const timezone = ALL_TIMEZONES.find((option) => option.utc.includes(zone))
  if (!timezone) throw new Error(`Timezone ${zone} not found`)
  return timezone
}

describe('getTimezoneLabel', () => {
  it.each([
    ['2026-01-09T03:12:00Z', '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris'],
    ['2026-10-09T03:12:00Z', '(UTC+02:00) Brussels, Copenhagen, Madrid, Paris'],
  ])('shows Madrid offset at %s', (date, label) => {
    expect(getTimezoneLabel(getTimezone('Europe/Madrid'), dayjs(date))).toBe(label)
  })

  it.each([
    ['2026-03-29T00:59:59Z', '(UTC+01:00)'],
    ['2026-03-29T01:00:00Z', '(UTC+02:00)'],
    ['2026-10-25T00:59:59Z', '(UTC+02:00)'],
    ['2026-10-25T01:00:00Z', '(UTC+01:00)'],
  ])('updates Madrid offset across daylight saving transitions at %s', (date, offset) => {
    expect(getTimezoneLabel(getTimezone('Europe/Madrid'), dayjs(date))).toBe(
      `${offset} Brussels, Copenhagen, Madrid, Paris`
    )
  })

  it.each([
    ['America/New_York', '2026-01-09T03:12:00Z', '(UTC-05:00)'],
    ['America/New_York', '2026-10-09T03:12:00Z', '(UTC-04:00)'],
    ['Asia/Kolkata', '2026-10-09T03:12:00Z', '(UTC+05:30)'],
    ['Asia/Kathmandu', '2026-10-09T03:12:00Z', '(UTC+05:45)'],
    ['Europe/London', '2026-10-09T03:12:00Z', '(UTC+01:00)'],
    ['America/St_Johns', '2026-01-09T03:12:00Z', '(UTC-03:30)'],
    ['Etc/GMT', '2026-10-09T03:12:00Z', '(UTC+00:00)'],
  ])('formats %s offset including its sign and minutes', (zone, date, offset) => {
    expect(getTimezoneLabel(getTimezone(zone), dayjs(date)).startsWith(offset)).toBe(true)
  })

  it('preserves the selected timezone and recovery timestamp', () => {
    const timezone = getTimezone('Europe/Madrid')
    const originalTimezone = structuredClone(timezone)
    const recoveryDate = dayjs('2026-10-09T03:12:00Z').tz(timezone.utc[0])
    const recoveryTimestamp = recoveryDate.unix()

    expect(recoveryDate.format('HH:mm:ss')).toBe('05:12:00')
    expect(recoveryDate.utc().format('HH:mm:ss')).toBe('03:12:00')
    expect(getTimezoneLabel(timezone, recoveryDate)).toBe(
      '(UTC+02:00) Brussels, Copenhagen, Madrid, Paris'
    )
    expect(recoveryDate.unix()).toBe(recoveryTimestamp)
    expect(timezone).toEqual(originalTimezone)
  })
})
