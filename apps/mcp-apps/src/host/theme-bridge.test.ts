import { describe, expect, it } from 'vitest'

import { srgbToOklchLightness } from './theme-bridge'

describe('srgbToOklchLightness', () => {
  it('maps black and white to the ends of the lightness scale', () => {
    // Host backgrounds drive Studio's --surface input, which expects OKLCH lightness.
    expect(srgbToOklchLightness(0, 0, 0)).toBeCloseTo(0, 3)
    expect(srgbToOklchLightness(255, 255, 255)).toBeCloseTo(1, 3)
  })

  it('reads a typical dark host background as dark', () => {
    expect(srgbToOklchLightness(33, 33, 33)).toBeLessThan(0.3)
  })
})
