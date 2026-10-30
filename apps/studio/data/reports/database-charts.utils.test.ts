import { describe, expect, it } from 'vitest'

import { getMemoryCommitmentRanges } from './database-charts.utils'

const GIB = 1024 ** 3

const pointForMemory = (physicalMemoryGiB: number, committedGiB = 0) => ({
  ram_commit_limit: (1 + physicalMemoryGiB / 2) * GIB,
  ram_commit_used: committedGiB * GIB,
})

describe('getMemoryCommitmentRanges', () => {
  it.each([
    [0.5, 0.8, 5, 7.4],
    [0.8, 0.9, 7.4, 8.2],
    [0.9, undefined, 8.2, 9],
  ])(
    'derives the %s threshold from physical RAM rather than the commit limit',
    (lower, upper, expectedLower, expectedUpper) => {
      const ranges = getMemoryCommitmentRanges([pointForMemory(8)], lower, upper)

      expect(ranges).toEqual([[expectedLower * GIB, expectedUpper * GIB]])
    }
  )

  it('uses historical compute size so resizing does not rewrite earlier thresholds', () => {
    expect(getMemoryCommitmentRanges([pointForMemory(2), pointForMemory(8)], 0.5, 0.8)).toEqual([
      [2 * GIB, 2.6 * GIB],
      [5 * GIB, 7.4 * GIB],
    ])
  })

  it('keeps commitments above capacity visible instead of clipping the chart', () => {
    expect(getMemoryCommitmentRanges([pointForMemory(8, 12), pointForMemory(8, 6)], 0.9)).toEqual([
      [8.2 * GIB, 12 * GIB],
      [8.2 * GIB, 12 * GIB],
    ])
  })
})
