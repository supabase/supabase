import { describe, expect, it } from 'vitest'

import { isoDateTimeString } from './iso-datetime'

describe('isoDateTimeString', () => {
  it('accepts a valid ISO datetime', () => {
    const raw = '2025-01-01T12:00:00.000Z'
    expect(isoDateTimeString(raw)).toBe(raw)
  })

  it('rejects an empty string', () => {
    expect(isoDateTimeString('')).toBeNull()
  })

  it('rejects junk', () => {
    expect(isoDateTimeString('not-a-date')).toBeNull()
    expect(isoDateTimeString('2025-13-45T99:99:99Z')).toBeNull()
  })
})
