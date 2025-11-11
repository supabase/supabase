import { describe, it, expect } from 'vitest'
import { computePeriodTotal } from './ReportChartV2'

describe('computePeriodTotal', () => {
  const attrs = [
    { attribute: 'SignInAttempts', label: 'Password', enabled: true },
    { attribute: 'SignInAttempts', label: 'PKCE', enabled: true },
    { attribute: 'SignInAttempts', label: 'Refresh Token', enabled: true },
    { attribute: 'SignInAttempts', label: 'ID Token', enabled: true },
  ]

  it('deduplicates attributes that map to same field', () => {
    const data = [
      { timestamp: 1, SignInAttempts: 1 },
      { timestamp: 2, SignInAttempts: 0 },
    ]
    expect(computePeriodTotal(data as any, attrs as any)).toBe(1)
  })

  it('excludes reference lines, max values, omitted and disabled attributes', () => {
    const data = [
      { timestamp: 1, a: 1, b: 2, c: 4, d: 8 },
      { timestamp: 2, a: 1, b: 2, c: 4, d: 8 },
    ]
    const attributes = [
      { attribute: 'a', enabled: true },
      { attribute: 'b', provider: 'reference-line', enabled: true },
      { attribute: 'c', isMaxValue: true, enabled: true },
      { attribute: 'd', omitFromTotal: true, enabled: true },
      { attribute: 'e', enabled: false },
    ]
    // Only 'a' should count: period total = 1+1 = 2
    expect(computePeriodTotal(data as any, attributes as any)).toBe(2)
  })
})
