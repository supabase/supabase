import { describe, expect, it } from 'vitest'

import { isTracingAllowed } from './braintrust-logger'

describe('isTracingAllowed', () => {
  it('returns true when all flags are explicitly false', () => {
    expect(isTracingAllowed({ isHipaaEnabled: false, isDpaSigned: false, isEuRegion: false })).toBe(
      true
    )
  })

  it('returns false when any flag is true', () => {
    expect(isTracingAllowed({ isHipaaEnabled: true, isDpaSigned: false, isEuRegion: false })).toBe(
      false
    )
    expect(isTracingAllowed({ isHipaaEnabled: false, isDpaSigned: true, isEuRegion: false })).toBe(
      false
    )
    expect(isTracingAllowed({ isHipaaEnabled: false, isDpaSigned: false, isEuRegion: true })).toBe(
      false
    )
  })

  it('returns false when flags are undefined (unknown = restricted)', () => {
    expect(
      isTracingAllowed({ isHipaaEnabled: undefined, isDpaSigned: undefined, isEuRegion: undefined })
    ).toBe(false)
    expect(
      isTracingAllowed({ isHipaaEnabled: false, isDpaSigned: undefined, isEuRegion: false })
    ).toBe(false)
  })
})
