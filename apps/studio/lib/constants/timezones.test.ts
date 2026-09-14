import { describe, expect, it } from 'vitest'

import {
  ALL_TIMEZONES,
  findTimezoneByIana,
  formatTimezoneLabel,
  getTimezoneOptions,
  TIMEZONES_BY_IANA,
} from '@/lib/constants/timezones'

describe('TIMEZONES_BY_IANA', () => {
  it('produces one row per primary IANA name', () => {
    const ianas = TIMEZONES_BY_IANA.map((entry) => entry.utc[0])
    expect(new Set(ianas).size).toBe(ianas.length)
  })

  it('prefers the standard-time row when catalog rows share a primary IANA', () => {
    const collisions = ALL_TIMEZONES.filter((entry) => entry.utc[0] === 'America/Los_Angeles')
    expect(collisions.length).toBeGreaterThan(1)

    const winner = TIMEZONES_BY_IANA.find((entry) => entry.utc[0] === 'America/Los_Angeles')
    expect(winner?.isdst).toBe(false)
  })

  it('preserves entries without a collision', () => {
    const utcRow = TIMEZONES_BY_IANA.find((entry) => entry.value === 'UTC')
    expect(utcRow?.text).toContain('Coordinated Universal Time')
    expect(utcRow?.utc[0]).toBe('America/Danmarkshavn')
  })
})

describe('getTimezoneOptions', () => {
  const options = getTimezoneOptions(new Date('2026-01-10T12:00:00Z'))
  const findByRegion = (region: string) => options.find((option) => option.label.endsWith(region))

  it('produces one option per representative IANA name', () => {
    const ianas = options.map((option) => option.iana)
    expect(new Set(ianas).size).toBe(ianas.length)
  })

  it.each([
    ['Vladivostok', 'Asia/Vladivostok'],
    ['Magadan', 'Asia/Magadan'],
    ['Novosibirsk', 'Asia/Novosibirsk'],
    ['Tokyo', 'Asia/Tokyo'],
    ['Nur-Sultan (Astana)', 'Asia/Almaty'],
    ['Solomon Is., New Caledonia', 'Pacific/Guadalcanal'],
    ['Coordinated Universal Time', 'UTC'],
  ])('stores the zone represented by the %s label', (region, expectedIana) => {
    expect(findByRegion(region)?.iana).toBe(expectedIana)
  })
})

describe('findTimezoneByIana', () => {
  it('matches an entry by its primary IANA name', () => {
    expect(findTimezoneByIana('America/Danmarkshavn')?.text).toContain('Coordinated Universal Time')
  })

  it('matches an entry by any secondary IANA name', () => {
    expect(findTimezoneByIana('Asia/Tokyo')?.utc).toContain('Asia/Tokyo')
  })

  it('returns undefined for an unknown IANA name', () => {
    expect(findTimezoneByIana('Not/A/Real_Zone')).toBeUndefined()
  })
})

describe('formatTimezoneLabel', () => {
  it('reports the offset at the supplied instant', () => {
    expect(formatTimezoneLabel('America/Chicago', new Date('2026-08-10T12:00:00Z'))).toBe(
      '(UTC-05:00) Central Time (US & Canada)'
    )
    expect(formatTimezoneLabel('America/Chicago', new Date('2026-01-10T12:00:00Z'))).toBe(
      '(UTC-06:00) Central Time (US & Canada)'
    )
  })

  it('uses the deduplicated standard-time region name in winter', () => {
    expect(formatTimezoneLabel('America/Los_Angeles', new Date('2026-01-10T12:00:00Z'))).toBe(
      '(UTC-08:00) Pacific Standard Time (US & Canada)'
    )
  })

  it.each(['2026-01-10T12:00:00Z', '2026-07-10T12:00:00Z'])(
    'keeps the Central Pacific representative at UTC+11 on %s',
    (date) => {
      expect(formatTimezoneLabel('Pacific/Guadalcanal', new Date(date))).toBe(
        '(UTC+11:00) Solomon Is., New Caledonia'
      )
    }
  )

  it('handles zones with a half-hour offset', () => {
    expect(formatTimezoneLabel('Asia/Kolkata', new Date('2026-08-10T12:00:00Z'))).toBe(
      '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi'
    )
  })

  it('falls back to the IANA name for zones missing from the catalog', () => {
    expect(formatTimezoneLabel('Not/A/Real_Zone', new Date('2026-08-10T12:00:00Z'))).toBe(
      '(UTC+00:00) Not/A/Real_Zone'
    )
  })
})
