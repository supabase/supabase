import { describe, expect, it } from 'vitest'

import { toUnixSecondsString } from './configcat-attributes'

describe('toUnixSecondsString', () => {
  it('converts a valid ISO datetime to Unix seconds', () => {
    expect(toUnixSecondsString('2024-01-01T00:00:00.000Z')).toBe('1704067200')
  })

  it('converts a datetime with no milliseconds', () => {
    expect(toUnixSecondsString('2024-01-01T00:00:00Z')).toBe('1704067200')
  })

  it('returns undefined for undefined', () => {
    expect(toUnixSecondsString(undefined)).toBeUndefined()
  })

  it('returns undefined for null', () => {
    expect(toUnixSecondsString(null)).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(toUnixSecondsString('')).toBeUndefined()
  })

  it('returns undefined for an unparseable string', () => {
    expect(toUnixSecondsString('not-a-date')).toBeUndefined()
  })
})
