import { describe, expect, it } from 'vitest'

import { hasValidTimestamp, sortByTimestamp } from './useFillTimeseriesSorted'
import type { Datum } from '@/components/ui/Charts/Charts.types'

describe('hasValidTimestamp', () => {
  it.each<[string, Datum[], string, boolean]>([
    ['has the timestamp key', [{ timestamp: '2024-01-01T00:00:00Z', value: 1 }], 'timestamp', true],
    [
      'has a custom timestamp key',
      [{ period_start: '2024-01-01T00:00:00Z' }],
      'period_start',
      true,
    ],
    ['is empty', [], 'timestamp', false],
    ['lacks the timestamp key', [{ value: 1 }], 'timestamp', false],
  ])('when data %s', (_, data, key, expected) => {
    expect(hasValidTimestamp(data, key)).toBe(expected)
  })
})

describe('sortByTimestamp', () => {
  it('sorts data in ascending order by the given timestamp key', () => {
    const data = [
      { period_start: '2024-01-03T00:00:00Z', value: 3 },
      { period_start: '2024-01-01T12:00:00Z', value: 1 },
      { period_start: '2024-01-02T00:00:00Z', value: 2 },
    ]

    expect(sortByTimestamp(data, 'period_start').map((d) => d.value)).toEqual([1, 2, 3])
  })

  it('handles an empty array', () => {
    expect(sortByTimestamp([], 'timestamp')).toEqual([])
  })

  it('keeps the original order for equal timestamps', () => {
    const data = [
      { timestamp: '2024-01-01T00:00:00Z', id: 'a' },
      { timestamp: '2024-01-01T00:00:00Z', id: 'b' },
      { timestamp: '2024-01-01T00:00:00Z', id: 'c' },
    ]

    expect(sortByTimestamp(data, 'timestamp').map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })
})
