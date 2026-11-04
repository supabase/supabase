import { describe, expect, it } from 'vitest'

import { decodeRouteParam } from './helpers'

describe('decodeRouteParam', () => {
  it('decodes percent-encoded spaces', () => {
    expect(decodeRouteParam('event%20triggers')).toBe('event triggers')
  })

  it('leaves plain values unchanged', () => {
    expect(decodeRouteParam('postgres')).toBe('postgres')
  })

  it('returns the raw value for malformed encoding instead of throwing', () => {
    expect(decodeRouteParam('%E0%A4%A')).toBe('%E0%A4%A')
  })
})
