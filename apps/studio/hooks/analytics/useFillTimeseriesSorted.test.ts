import { describe, expect, it } from 'vitest'

import { hasValidTimestamp, sortByTimestamp } from './useFillTimeseriesSorted'

describe('hasValidTimestamp', () => {
  it('should return true when data has valid timestamp key', () => {
    const data = [{ timestamp: '2024-01-01T00:00:00Z', value: 1 }]
    expect(hasValidTimestamp(data, 'timestamp')).toBe(true)
  })

  it('should return false when data is empty', () => {
    expect(hasValidTimestamp([], 'timestamp')).toBe(false)
  })

  it('should return false when timestamp key does not exist', () => {
    const data = [{ value: 1 }]
    expect(hasValidTimestamp(data, 'timestamp')).toBe(false)
  })

  it('should work with custom timestamp key', () => {
    const data = [{ period_start: '2024-01-01T00:00:00Z', value: 1 }]
    expect(hasValidTimestamp(data, 'period_start')).toBe(true)
  })
})

describe('sortByTimestamp', () => {
  it('should sort data in ascending order by timestamp', () => {
    const data = [
      { timestamp: '2024-01-03T00:00:00Z', value: 3 },
      { timestamp: '2024-01-01T00:00:00Z', value: 1 },
      { timestamp: '2024-01-02T00:00:00Z', value: 2 },
    ]

    const sorted = sortByTimestamp(data, 'timestamp')

    expect(sorted[0].value).toBe(1)
    expect(sorted[1].value).toBe(2)
    expect(sorted[2].value).toBe(3)
  })

  it('should handle already sorted data', () => {
    const data = [
      { timestamp: '2024-01-01T00:00:00Z', value: 1 },
      { timestamp: '2024-01-02T00:00:00Z', value: 2 },
    ]

    const sorted = sortByTimestamp(data, 'timestamp')

    expect(sorted[0].value).toBe(1)
    expect(sorted[1].value).toBe(2)
  })

  it('should handle empty array', () => {
    const sorted = sortByTimestamp([], 'timestamp')
    expect(sorted).toEqual([])
  })

  it('should handle single item', () => {
    const data = [{ timestamp: '2024-01-01T00:00:00Z', value: 1 }]
    const sorted = sortByTimestamp(data, 'timestamp')
    expect(sorted).toEqual(data)
  })

  it('should work with custom timestamp key', () => {
    const data = [
      { period_start: '2024-01-03T00:00:00Z', value: 3 },
      { period_start: '2024-01-01T00:00:00Z', value: 1 },
      { period_start: '2024-01-02T00:00:00Z', value: 2 },
    ]

    const sorted = sortByTimestamp(data, 'period_start')

    expect(sorted[0].value).toBe(1)
    expect(sorted[1].value).toBe(2)
    expect(sorted[2].value).toBe(3)
  })

  it('should handle timestamps with different time zones', () => {
    const data = [
      { timestamp: '2024-01-01T12:00:00Z', value: 2 },
      { timestamp: '2024-01-01T00:00:00Z', value: 1 },
      { timestamp: '2024-01-01T18:00:00Z', value: 3 },
    ]

    const sorted = sortByTimestamp(data, 'timestamp')

    expect(sorted[0].value).toBe(1)
    expect(sorted[1].value).toBe(2)
    expect(sorted[2].value).toBe(3)
  })

  it('should maintain stable sort for equal timestamps', () => {
    const data = [
      { timestamp: '2024-01-01T00:00:00Z', value: 1, id: 'a' },
      { timestamp: '2024-01-01T00:00:00Z', value: 2, id: 'b' },
      { timestamp: '2024-01-01T00:00:00Z', value: 3, id: 'c' },
    ]

    const sorted = sortByTimestamp(data, 'timestamp')

    // Should maintain original order for equal timestamps
    expect(sorted[0].id).toBe('a')
    expect(sorted[1].id).toBe('b')
    expect(sorted[2].id).toBe('c')
  })
})
