import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  findTimezoneByIana,
  getTimezoneLabel,
  getTimezoneLabelByIana,
  TIMEZONES_BY_IANA,
} from '@/lib/constants/timezones'

describe('TIMEZONES_BY_IANA', () => {
  it('produces one row per primary IANA name', () => {
    const ianas = TIMEZONES_BY_IANA.map((entry) => entry.utc[0])
    expect(new Set(ianas).size).toBe(ianas.length)
  })

  it('prefers the standard-time row when multiple catalog rows share a primary IANA', () => {
    // The catalog has both PDT (isdst: true) and PST (isdst: false) pointing
    // at America/Los_Angeles. The deduped view should pick the standard one
    // so the picker label doesn't flip on DST changes.
    const matches = TIMEZONES_BY_IANA.filter((entry) => entry.utc[0] === 'America/Los_Angeles')
    expect(matches).toHaveLength(1)
    expect(matches[0].isdst).toBe(false)
  })

  it('has no labels that name a fixed DST state, since the offset in the label is date-aware', () => {
    const labels = TIMEZONES_BY_IANA.map((entry) => entry.text)
    expect(labels.filter((label) => /Daylight|Standard/.test(label))).toEqual([])
  })

  it('preserves entries that have no collision', () => {
    // Most rows have a unique primary IANA. The UTC catalog row's primary is
    // 'America/Danmarkshavn' and survives the dedupe pass unchanged.
    const utcRow = TIMEZONES_BY_IANA.find((entry) => entry.value === 'UTC')
    expect(utcRow?.text).toContain('Coordinated Universal Time')
    expect(utcRow?.utc[0]).toBe('America/Danmarkshavn')
  })
})

describe('catalog integrity', () => {
  const getOffsetHours = (timeZone: string, date: Date) => {
    const value = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value
    const match = value?.match(/GMT([+-])(\d\d):(\d\d)/)
    if (!match) return 0
    return (match[1] === '-' ? -1 : 1) * (Number(match[2]) + Number(match[3]) / 60)
  }

  const winter = new Date('2026-01-15T12:00:00Z')
  const summer = new Date('2026-07-15T12:00:00Z')

  const cases = TIMEZONES_BY_IANA.flatMap((entry) =>
    entry.utc.map((iana) => [entry.text, iana, entry] as const)
  )

  it.each(cases)('%s: %s has the offset in its label in winter or summer', (_text, iana, entry) => {
    const match = entry.text.match(/^\(UTC(?:([+-])(\d\d):(\d\d))?\)/)
    expect(match).not.toBeNull()
    const labelOffset = match?.[1]
      ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) + Number(match[3]) / 60)
      : 0

    expect([getOffsetHours(iana, winter), getOffsetHours(iana, summer)]).toContain(labelOffset)
  })
})

describe('findTimezoneByIana', () => {
  it('matches the entry by its primary IANA name', () => {
    const entry = findTimezoneByIana('America/Danmarkshavn')
    expect(entry?.text).toContain('Coordinated Universal Time')
  })

  it('matches the entry by any of its secondary IANA names', () => {
    // 'Asia/Tokyo' is one of the IANA aliases on the JST row whose primary
    // IANA is 'Asia/Dili'. Lookup must walk the full alias list.
    const entry = findTimezoneByIana('Asia/Tokyo')
    expect(entry?.utc).toContain('Asia/Tokyo')
  })

  it('returns the deduplicated row when the zone belongs to a collapsed catalog row', () => {
    // Europe/Nicosia is only listed on the "E. Europe" row, which collapses into
    // "Athens, Bucharest" because both share the primary Asia/Nicosia.
    const entry = findTimezoneByIana('Europe/Nicosia')
    expect(entry).toBe(TIMEZONES_BY_IANA.find((row) => row.utc[0] === entry?.utc[0]))
    expect(entry?.text).toContain('Athens, Bucharest')
  })

  it('returns undefined for an unknown IANA name', () => {
    expect(findTimezoneByIana('Not/A/Real_Zone')).toBeUndefined()
  })
})

const getTimezone = (zone: string) => {
  const timezone = findTimezoneByIana(zone)
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

describe('getTimezoneLabel at a zero offset', () => {
  it('formats it as +00:00 like every other row', () => {
    const utc = TIMEZONES_BY_IANA.find((entry) => entry.value === 'UTC')!
    expect(getTimezoneLabel(utc, '2026-07-15T12:00:00Z')).toBe(
      '(UTC+00:00) Coordinated Universal Time'
    )
  })
})

describe('getTimezoneLabelByIana', () => {
  it('uses the offset in effect at the given date', () => {
    expect(getTimezoneLabelByIana('Europe/Madrid', '2026-01-09T03:12:00Z')).toBe(
      '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris'
    )
    expect(getTimezoneLabelByIana('Europe/Madrid', '2026-10-09T03:12:00Z')).toBe(
      '(UTC+02:00) Brussels, Copenhagen, Madrid, Paris'
    )
  })

  it('defaults to the current date', () => {
    expect(getTimezoneLabelByIana('Europe/Madrid')).toBe(
      getTimezoneLabel(getTimezone('Europe/Madrid'), dayjs())
    )
  })

  it('falls back to the IANA name when the zone is not in the catalog', () => {
    expect(getTimezoneLabelByIana('Not/A/Real_Zone')).toBe('Not/A/Real_Zone')
  })
})
