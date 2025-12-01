import { describe, expect, test } from 'vitest'

import {
  buildCountsByIso2,
  buildBaseIso2ToName,
  normalizeIso2ToName,
  buildTopoNameToCount,
  getFillColor,
  isMicroCountry,
  isKnownCountryCode,
  computeMarkerRadius,
  MAP_CHART_THEME,
} from 'components/interfaces/Reports/utils/geo'

describe('geo utils', () => {
  test('buildCountsByIso2 aggregates and normalizes input', () => {
    const rows = [
      { country: 'us', count: 1 },
      { country: 'US', count: '2' },
      { country: 'sg', count: 3 },
      { country: null, count: 9 },
      { country: 'us', count: 'not-a-number' },
    ]
    const counts = buildCountsByIso2(rows as any)
    expect(counts).toEqual({ US: 3, SG: 3 })
  })

  test('normalizeIso2ToName applies expected overrides', () => {
    const base = buildBaseIso2ToName()
    const norm = normalizeIso2ToName(base)
    expect(norm['US']).toBe('United States of America')
    expect(norm['RU']).toBe('Russia')
    expect(norm['CI']).toBe("Côte d'Ivoire")
    expect(norm['KR']).toBe('South Korea')
  })

  test('buildTopoNameToCount maps iso2 counts to normalized names', () => {
    const counts = { US: 5, KR: 3, RU: 2 }
    const norm = normalizeIso2ToName(buildBaseIso2ToName())
    const map = buildTopoNameToCount(counts, norm)
    expect(map.get('United States of America')).toBe(5)
    expect(map.get('South Korea')).toBe(3)
    expect(map.get('Russia')).toBe(2)
  })

  test('getFillColor returns muted color when max=0 or value=0', () => {
    const theme = MAP_CHART_THEME.dark
    expect(getFillColor(0, 0, theme)).toBe(theme.zeroFill)
    expect(getFillColor(0, 10, theme)).toBe(theme.zeroFill)
  })

  test('isMicroCountry identifies small states', () => {
    expect(isMicroCountry('Monaco')).toBe(true)
    expect(isMicroCountry('Singapore')).toBe(true)
    expect(isMicroCountry('Germany')).toBe(false)
  })

  test('isKnownCountryCode guards country codes', () => {
    expect(isKnownCountryCode('US')).toBe(true)
    expect(isKnownCountryCode('XX')).toBe(false)
  })

  test('computeMarkerRadius scales between bounds', () => {
    expect(computeMarkerRadius(0, 0)).toBe(2)
    const rLow = computeMarkerRadius(1, 100)
    const rHigh = computeMarkerRadius(90, 100)
    expect(rLow).toBeGreaterThanOrEqual(1.5)
    expect(rHigh).toBeLessThanOrEqual(4)
    expect(rHigh).toBeGreaterThan(rLow)
  })
})


