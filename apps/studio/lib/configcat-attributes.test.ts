import { describe, expect, it } from 'vitest'

import { toUnixSecondsString } from './configcat-attributes'

describe('toUnixSecondsString', () => {
  it('converts a valid ISO datetime to Unix seconds', () => {
    expect(toUnixSecondsString('2024-01-01T00:00:00.000Z')).toBe('1704067200')
  })

  it('converts a datetime with no milliseconds', () => {
    expect(toUnixSecondsString('2024-01-01T00:00:00Z')).toBe('1704067200')
  })

  it.each([undefined, null, '', 'not-a-date'])('returns undefined for %o', (value) => {
    expect(toUnixSecondsString(value)).toBeUndefined()
  })
})
