import { describe, expect, it } from 'vitest'

import {
  buildSortedServiceCards,
  computeSuccessAndNonSuccessRates,
  getBucketLogRange,
  isServiceDisabled,
  sortServicesByTraffic,
  sumErrors,
  sumTotal,
  sumWarnings,
} from './ProjectUsage.metrics'

describe('ProjectUsage.metrics', () => {
  const data = [
    { timestamp: '2025-10-22T13:00:00Z', ok_count: 90, warning_count: 5, error_count: 5 },
    { timestamp: '2025-10-22T13:01:00Z', ok_count: 50, warning_count: 10, error_count: 0 },
  ]

  it('sum helpers compute totals correctly', () => {
    expect(sumTotal(data)).toBe(160)
    expect(sumWarnings(data)).toBe(15)
    expect(sumErrors(data)).toBe(5)
  })

  it('computeSuccessAndNonSuccessRates returns expected percentages', () => {
    const total = sumTotal(data)
    const warns = sumWarnings(data)
    const errs = sumErrors(data)
    const { successRate, nonSuccessRate } = computeSuccessAndNonSuccessRates(total, warns, errs)

    // success = 160 - (15 + 5) = 140 -> 87.5%
    expect(successRate).toBeCloseTo(87.5)
    expect(nonSuccessRate).toBeCloseTo(12.5)
  })

  it('computeSuccessAndNonSuccessRates returns zeroes when there are no requests', () => {
    expect(computeSuccessAndNonSuccessRates(0, 0, 0)).toEqual({ successRate: 0, nonSuccessRate: 0 })
  })

  describe('sortServicesByTraffic', () => {
    it('orders services by total descending', () => {
      const sorted = sortServicesByTraffic([
        { key: 'a', total: 10 },
        { key: 'b', total: 100 },
        { key: 'c', total: 50 },
      ])
      expect(sorted.map((s) => s.key)).toEqual(['b', 'c', 'a'])
    })

    it('pushes services with no traffic to the end', () => {
      const sorted = sortServicesByTraffic([
        { key: 'empty', total: 0 },
        { key: 'busy', total: 25 },
        { key: 'idle', total: 0 },
      ])
      expect(sorted.map((s) => s.key)).toEqual(['busy', 'empty', 'idle'])
    })

    it('does not mutate the input array', () => {
      const input = [
        { key: 'a', total: 1 },
        { key: 'b', total: 2 },
      ]
      sortServicesByTraffic(input)
      expect(input.map((s) => s.key)).toEqual(['a', 'b'])
    })
  })

  describe('isServiceDisabled', () => {
    it('is not disabled while loading', () => {
      expect(isServiceDisabled(0, true)).toBe(false)
    })

    it('is disabled when settled with no traffic', () => {
      expect(isServiceDisabled(0, false)).toBe(true)
    })

    it('is not disabled when there is traffic', () => {
      expect(isServiceDisabled(42, false)).toBe(false)
    })
  })

  describe('getBucketLogRange', () => {
    const timestamp = '2024-01-15T12:00:00.000Z'

    it('returns the bucket start unchanged and a one-minute window for 1hr', () => {
      expect(getBucketLogRange(timestamp, '1hr')).toEqual({
        start: timestamp,
        end: '2024-01-15T12:01:00.000Z',
      })
    })

    it('returns a one-hour window for 1day', () => {
      expect(getBucketLogRange(timestamp, '1day')).toEqual({
        start: timestamp,
        end: '2024-01-15T13:00:00.000Z',
      })
    })

    it('returns a one-day window for 7day', () => {
      expect(getBucketLogRange(timestamp, '7day')).toEqual({
        start: timestamp,
        end: '2024-01-16T12:00:00.000Z',
      })
    })

    it('parses a timestamp without a timezone designator as UTC', () => {
      expect(getBucketLogRange('2024-01-15T12:00:00', '1hr').end).toBe('2024-01-15T12:01:00.000Z')
    })
  })

  describe('buildSortedServiceCards', () => {
    const stats = (total: number, warningCount = 0, errorCount = 0) => ({
      eventChartData: [],
      total,
      warningCount,
      errorCount,
    })

    it('drops disabled services, maps stats, and sorts by traffic', () => {
      const cards = buildSortedServiceCards(
        [
          { key: 'a', enabled: true },
          { key: 'b', enabled: false },
          { key: 'c', enabled: true },
        ],
        { a: stats(10, 1, 2), b: stats(999), c: stats(50) }
      )

      expect(cards.map((c) => c.key)).toEqual(['c', 'a'])
      expect(cards[1]).toMatchObject({ key: 'a', total: 10, warn: 1, err: 2, data: [] })
    })
  })
})
