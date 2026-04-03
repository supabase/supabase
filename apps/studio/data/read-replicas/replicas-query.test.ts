import { describe, expect, it } from 'vitest'

import {
  getMaxReplicas,
  READ_REPLICA_COMPUTE_CAPS,
  READ_REPLICAS_MAX_COUNT,
} from './replicas-query'

describe('getMaxReplicas', () => {
  it('returns 0 for ineligible compute sizes (pico, nano, micro)', () => {
    expect(getMaxReplicas('ci_pico')).toBe(0)
    expect(getMaxReplicas('ci_nano')).toBe(0)
    expect(getMaxReplicas('ci_micro')).toBe(0)
  })

  it('returns 4 for ci_small', () => {
    expect(getMaxReplicas('ci_small')).toBe(4)
  })

  it('returns 4 for ci_medium', () => {
    expect(getMaxReplicas('ci_medium')).toBe(4)
  })

  it('returns 4 for ci_large', () => {
    expect(getMaxReplicas('ci_large')).toBe(4)
  })

  it('returns READ_REPLICAS_MAX_COUNT for ci_xlarge and above', () => {
    expect(getMaxReplicas('ci_xlarge')).toBe(READ_REPLICAS_MAX_COUNT)
    expect(getMaxReplicas('ci_2xlarge')).toBe(READ_REPLICAS_MAX_COUNT)
  })

  it('returns READ_REPLICAS_MAX_COUNT for any unknown compute tier', () => {
    expect(getMaxReplicas('unknown_tier')).toBe(READ_REPLICAS_MAX_COUNT)
  })

  it('returns READ_REPLICAS_MAX_COUNT when no compute addon is provided', () => {
    expect(getMaxReplicas(undefined)).toBe(READ_REPLICAS_MAX_COUNT)
  })

  it('all eligible READ_REPLICA_COMPUTE_CAPS are greater than 0 and at most READ_REPLICAS_MAX_COUNT', () => {
    for (const [key, cap] of Object.entries(READ_REPLICA_COMPUTE_CAPS)) {
      if (cap > 0) {
        expect(cap).toBeLessThanOrEqual(READ_REPLICAS_MAX_COUNT)
      }
    }
  })
})
