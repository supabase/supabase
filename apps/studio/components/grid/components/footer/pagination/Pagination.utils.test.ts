import { describe, expect, test } from 'vitest'

import { formatEstimatedCount } from './Pagination.utils'

describe('formatEstimatedCount', () => {
  test.each([
    [1530, '1.5K'],
    [153122, '153.1K'],
    [1531021, '1.5M'],
    [15310212, '15.3M'],
    [1531021211, '1.5B'],
    [1531021211232, '1.5T'],
    // Maxes out at trillions
    [1531021211232222, '1531.0T'],
  ])('formats %d as %s', (count, expected) => {
    expect(formatEstimatedCount(count)).toBe(expected)
  })
})
