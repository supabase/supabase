import { describe, expect, it } from 'vitest'

import { STORAGE_RETENTION_KEYS, toStorageSizeChartData } from './StorageRetention.utils'

const daily = [
  { date: '2026-07-20T02:00:00.000Z', live: 10, versions: 2, snapshots: 3 },
  { date: '2026-07-21T02:00:00.000Z', live: 11, versions: 2, snapshots: 4 },
]

describe('toStorageSizeChartData', () => {
  it('maps each day to the retention series keys', () => {
    const [first] = toStorageSizeChartData(daily)
    expect(first[STORAGE_RETENTION_KEYS.live]).toBe(10)
    expect(first[STORAGE_RETENTION_KEYS.versions]).toBe(2)
    expect(first[STORAGE_RETENTION_KEYS.snapshots]).toBe(3)
  })

  it('formats a valid period label instead of "Invalid Date"', () => {
    const [first] = toStorageSizeChartData(daily)
    expect(first.periodStartFormatted).toBe('20 Jul')
    expect(first.periodStartFormatted).not.toMatch(/invalid/i)
  })

  it('preserves the original timestamp as period_start', () => {
    const [first] = toStorageSizeChartData(daily)
    expect(first.period_start).toBe(daily[0].date)
  })

  it('preserves the number and order of days', () => {
    const result = toStorageSizeChartData(daily)
    expect(result).toHaveLength(2)
    expect(result[1].period_start).toBe(daily[1].date)
  })

  it('returns an empty array for an empty series', () => {
    expect(toStorageSizeChartData([])).toEqual([])
  })
})
