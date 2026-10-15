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
  ])('uses physical RAM for the %s zone', (lower, upper, expectedLower, expectedUpper) => {
    const ranges = getMemoryCommitmentRanges([pointForMemory(8)], lower, upper)

    expect(ranges).toEqual([[expectedLower * GIB, expectedUpper * GIB]])
  })

  it('uses the compute capacity at each timestamp', () => {
    expect(getMemoryCommitmentRanges([pointForMemory(2), pointForMemory(8)], 0.5, 0.8)).toEqual([
      [2 * GIB, 2.6 * GIB],
      [5 * GIB, 7.4 * GIB],
    ])
  })

  it('extends the extreme hazard band to commitments above estimated capacity', () => {
    expect(getMemoryCommitmentRanges([pointForMemory(8, 12), pointForMemory(8, 6)], 0.9)).toEqual([
      [8.2 * GIB, 12 * GIB],
      [8.2 * GIB, 12 * GIB],
    ])
  })

  it.each(['', '123', 0, -1, GIB, Number.NaN, Infinity, -Infinity])(
    'omits risk zones when the commit limit is %s',
    (ram_commit_limit) => {
      const data = [{ ram_commit_limit, ram_commit_used: 0 }]
      expect(getMemoryCommitmentRanges(data, 0.5, 0.8)).toEqual([null])
    }
  )

  it('ignores nonfinite commitments when extending the extreme hazard band', () => {
    expect(getMemoryCommitmentRanges([pointForMemory(8, Infinity)], 0.9)).toEqual([
      [8.2 * GIB, 9 * GIB],
    ])
  })

  it('omits risk zones when the commit limit is missing', () => {
    expect(getMemoryCommitmentRanges([{ ram_commit_used: 0 }], 0.5, 0.8)).toEqual([null])
  })

  it('returns no ranges for an empty dataset', () => {
    expect(getMemoryCommitmentRanges([], 0.5, 0.8)).toEqual([])
  })
})
