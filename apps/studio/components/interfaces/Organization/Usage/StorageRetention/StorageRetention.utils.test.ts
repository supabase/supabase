import { describe, expect, it } from 'vitest'

import { splitStorageSizeByRetention, STORAGE_RETENTION_KEYS } from './StorageRetention.utils'

const TOTAL_KEY = 'storage_size'
const point = (total: number) => ({ period_start: '2026-07-24', [TOTAL_KEY]: total })

describe('splitStorageSizeByRetention', () => {
  it('splits each point proportionally to the retention totals', () => {
    const [result] = splitStorageSizeByRetention([point(100)], TOTAL_KEY, {
      live: 50,
      versions: 25,
      snapshots: 25,
    })

    expect(result[STORAGE_RETENTION_KEYS.versions]).toBe(25)
    expect(result[STORAGE_RETENTION_KEYS.snapshots]).toBe(25)
    expect(result[STORAGE_RETENTION_KEYS.live]).toBe(50)
  })

  it('preserves the per-day total across the three segments', () => {
    const [result] = splitStorageSizeByRetention([point(97)], TOTAL_KEY, {
      live: 61,
      versions: 24,
      snapshots: 32,
    })

    const sum =
      Number(result[STORAGE_RETENTION_KEYS.live]) +
      Number(result[STORAGE_RETENTION_KEYS.versions]) +
      Number(result[STORAGE_RETENTION_KEYS.snapshots])

    expect(sum).toBeCloseTo(97)
  })

  it('attributes everything to live objects when there is no retention data', () => {
    const [result] = splitStorageSizeByRetention([point(42)], TOTAL_KEY, undefined)

    expect(result[STORAGE_RETENTION_KEYS.live]).toBe(42)
    expect(result[STORAGE_RETENTION_KEYS.versions]).toBe(0)
    expect(result[STORAGE_RETENTION_KEYS.snapshots]).toBe(0)
  })

  it('handles empty days without dividing by zero', () => {
    const [result] = splitStorageSizeByRetention([point(0)], TOTAL_KEY, {
      live: 0,
      versions: 0,
      snapshots: 0,
    })

    expect(result[STORAGE_RETENTION_KEYS.live]).toBe(0)
    expect(result[STORAGE_RETENTION_KEYS.versions]).toBe(0)
    expect(result[STORAGE_RETENTION_KEYS.snapshots]).toBe(0)
  })

  it('keeps the original total key intact', () => {
    const [result] = splitStorageSizeByRetention([point(10)], TOTAL_KEY, {
      live: 5,
      versions: 3,
      snapshots: 2,
    })

    expect(result[TOTAL_KEY]).toBe(10)
  })
})
