import { describe, expect, test } from 'vitest'

import { getGeographicUsageMarkerRadius } from './GeographicUsageSection'

describe('getGeographicUsageMarkerRadius', () => {
  test('scales bubble area by the square root of request volume', () => {
    expect(getGeographicUsageMarkerRadius(100, 100)).toBe(20)
    expect(getGeographicUsageMarkerRadius(25, 100)).toBe(12.5)
  })

  test('returns the minimum radius when there is no request maximum', () => {
    expect(getGeographicUsageMarkerRadius(0, 0)).toBe(5)
  })
})
