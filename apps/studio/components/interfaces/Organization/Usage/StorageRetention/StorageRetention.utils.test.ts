import { describe, expect, it } from 'vitest'

import { STORAGE_SIZE_SEGMENTS } from './StorageRetention.constants'
import { toStorageSizeChartData } from './StorageRetention.utils'
import type { StorageRetentionDayPoint } from '@/data/storage/versioning/storage-retention-usage-query'

const day = (overrides: Partial<StorageRetentionDayPoint> = {}): StorageRetentionDayPoint => ({
  date: '2026-08-01T00:00:00Z',
  current: 100,
  noncurrent: 25,
  ...overrides,
})

describe('toStorageSizeChartData', () => {
  it('returns an empty series for no data, rather than a placeholder point', () => {
    expect(toStorageSizeChartData([])).toEqual([])
  })

  it('emits one point per day, in the order given', () => {
    const points = toStorageSizeChartData([
      day({ date: '2026-08-01T00:00:00Z' }),
      day({ date: '2026-08-02T00:00:00Z' }),
    ])
    expect(points.map((point) => point.period_start)).toEqual([
      '2026-08-01T00:00:00Z',
      '2026-08-02T00:00:00Z',
    ])
  })

  it('maps each retention total onto the chart series key the attribute list declares', () => {
    // A mismatch here means a stacked bar silently renders as zero, so the keys
    // must come from the same source the attributes do.
    const [point] = toStorageSizeChartData([day()])
    expect(point.current).toBe(100)
    expect(point.noncurrent).toBe(25)
  })

  it('emits a series for every declared segment', () => {
    const [point] = toStorageSizeChartData([day()])
    for (const segment of STORAGE_SIZE_SEGMENTS) {
      expect(point, segment.attributeKey).toHaveProperty(segment.attributeKey)
    }
  })

  it('formats the axis label as day and short month', () => {
    const [point] = toStorageSizeChartData([day({ date: '2026-08-09T00:00:00Z' })])
    expect(point.periodStartFormatted).toBe('09 Aug')
  })

  it('keeps zeros as zeros so an empty segment still stacks', () => {
    const [point] = toStorageSizeChartData([day({ noncurrent: 0 })])
    expect(point.noncurrent).toBe(0)
  })
})
