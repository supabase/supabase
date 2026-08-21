import { describe, expect, it } from 'vitest'

import { ALL_TIMEZONES, findTimezoneByIana, TIMEZONES_BY_IANA } from '@/lib/constants/timezones'

describe('TIMEZONES_BY_IANA', () => {
  it('produces one row per primary IANA name', () => {
    const ianas = TIMEZONES_BY_IANA.map((entry) => entry.utc[0])
    expect(new Set(ianas).size).toBe(ianas.length)
  })

  it('prefers the standard-time row when multiple catalog rows share a primary IANA', () => {
    // ALL_TIMEZONES has both PDT (isdst: true) and PST (isdst: false) pointing
    // at America/Los_Angeles. The deduped view should pick the standard one
    // so the picker label doesn't flip on DST changes.
    const collisions = ALL_TIMEZONES.filter((entry) => entry.utc[0] === 'America/Los_Angeles')
    expect(collisions.length).toBeGreaterThan(1)

    const winner = TIMEZONES_BY_IANA.find((entry) => entry.utc[0] === 'America/Los_Angeles')
    expect(winner).toBeDefined()
    expect(winner!.isdst).toBe(false)
  })

  it('preserves entries that have no collision', () => {
    // Most rows have a unique primary IANA. The UTC catalog row's primary is
    // 'America/Danmarkshavn' and survives the dedupe pass unchanged.
    const utcRow = TIMEZONES_BY_IANA.find((entry) => entry.value === 'UTC')
    expect(utcRow?.text).toContain('Coordinated Universal Time')
    expect(utcRow?.utc[0]).toBe('America/Danmarkshavn')
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

  it('returns undefined for an unknown IANA name', () => {
    expect(findTimezoneByIana('Not/A/Real_Zone')).toBeUndefined()
  })
})
