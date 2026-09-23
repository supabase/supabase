import { describe, expect, it } from 'vitest'

import {
  aggregateBurndownData,
  deriveBurndownAggregation,
  formatBurndownCurrencyCompact,
  formatBurndownCurrencySigned,
  mapBurndownResponse,
  type BurndownDataPoint,
} from './CreditBurndownChart.utils'

const point = (timestamp: string, balance: number, amount: number): BurndownDataPoint => ({
  timestamp,
  balance,
  breakdown: [{ key: 'compute', label: 'Compute', amount }],
})

describe('formatBurndownCurrencyCompact', () => {
  it('abbreviates thousands with K and millions with M', () => {
    expect(formatBurndownCurrencyCompact(1234)).toBe('$1.2K')
    expect(formatBurndownCurrencyCompact(12000)).toBe('$12K')
    expect(formatBurndownCurrencyCompact(2500000)).toBe('$2.5M')
  })

  it('leaves small amounts unabbreviated', () => {
    expect(formatBurndownCurrencyCompact(42)).toBe('$42')
  })
})

describe('formatBurndownCurrencySigned', () => {
  it('prefixes credits added with a plus sign', () => {
    expect(formatBurndownCurrencySigned(50)).toBe('+$50.00')
  })

  it('shows credits consumed with a minus sign', () => {
    expect(formatBurndownCurrencySigned(-12.5)).toBe('-$12.50')
  })
})

describe('deriveBurndownAggregation', () => {
  it('buckets by day when the range is under 30 days', () => {
    expect(deriveBurndownAggregation(new Date('2026-01-01'), new Date('2026-01-15'))).toBe('day')
  })

  it('buckets by week when the range is 30 days or more', () => {
    expect(deriveBurndownAggregation(new Date('2026-01-01'), new Date('2026-01-30'))).toBe('week')
    expect(deriveBurndownAggregation(new Date('2026-01-01'), new Date('2026-03-01'))).toBe('week')
  })
})

describe('mapBurndownResponse', () => {
  it('converts cents to dollars and formats breakdown item labels', () => {
    const [entry] = mapBurndownResponse([
      {
        day: '2026-01-01',
        amount_cents: 1500,
        ending_balance_cents: 8500,
        breakdown: [{ item: 'edge_functions', amount_cents: 1500 }],
      },
    ])

    expect(entry.balance).toBe(85)
    expect(entry.breakdown).toEqual([
      { key: 'edge_functions', label: 'Edge Functions', amount: 15 },
    ])
  })

  it('drops breakdown items with zero consumption', () => {
    const [entry] = mapBurndownResponse([
      {
        day: '2026-01-01',
        amount_cents: 1000,
        ending_balance_cents: 9000,
        breakdown: [
          { item: 'compute', amount_cents: 1000 },
          { item: 'storage', amount_cents: 0 },
        ],
      },
    ])

    expect(entry.breakdown.map((item) => item.key)).toEqual(['compute'])
  })

  it('keeps negative amounts (credits consumed) alongside positive amounts (credits added)', () => {
    const [entry] = mapBurndownResponse([
      {
        day: '2026-01-01',
        amount_cents: -500,
        ending_balance_cents: 9500,
        breakdown: [
          { item: 'compute', amount_cents: -1000 },
          { item: 'top_up', amount_cents: 500 },
        ],
      },
    ])

    expect(entry.breakdown).toEqual([
      { key: 'compute', label: 'Compute', amount: -10 },
      { key: 'top_up', label: 'Top Up', amount: 5 },
    ])
  })
})

describe('aggregateBurndownData', () => {
  it('returns the data unchanged for daily aggregation', () => {
    const data = [point('2026-01-01T00:00:00Z', 90, 10), point('2026-01-02T00:00:00Z', 80, 10)]

    expect(aggregateBurndownData(data, 'day')).toEqual(data)
  })

  it('keeps the latest balance in each bucket, not the sum or average', () => {
    const data = [
      point('2026-01-05T00:00:00Z', 90, 10),
      point('2026-01-06T00:00:00Z', 80, 10),
      point('2026-01-07T00:00:00Z', 70, 10),
    ]

    const [bucket] = aggregateBurndownData(data, 'week')

    expect(bucket.balance).toBe(70)
    expect(bucket.timestamp).toBe('2026-01-07T00:00:00Z')
  })

  it('sums breakdown amounts within a bucket', () => {
    const data = [point('2026-01-05T00:00:00Z', 90, 10), point('2026-01-06T00:00:00Z', 80, 10)]

    const [bucket] = aggregateBurndownData(data, 'week')

    expect(bucket.breakdown).toEqual([{ key: 'compute', label: 'Compute', amount: 20 }])
  })

  it('splits data into separate weekly buckets', () => {
    const data = [point('2026-01-04T00:00:00Z', 90, 10), point('2026-01-12T00:00:00Z', 80, 10)]

    const buckets = aggregateBurndownData(data, 'week')

    expect(buckets).toHaveLength(2)
  })
})
