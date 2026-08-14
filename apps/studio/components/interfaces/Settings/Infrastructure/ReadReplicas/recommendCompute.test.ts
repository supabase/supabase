import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  requestRecommendCompute,
  subscribeRecommendCompute,
} from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/recommendCompute'

describe('recommendCompute bridge', () => {
  afterEach(() => {
    // Clear any leftover subscriber or queued recommendation between tests.
    subscribeRecommendCompute(() => {})()
  })

  it('delivers the recommended size to the active subscriber', () => {
    const listener = vi.fn()
    subscribeRecommendCompute(listener)

    requestRecommendCompute('ci_small')
    expect(listener).toHaveBeenCalledWith('ci_small')
  })

  it('queues a recommendation until a subscriber mounts', () => {
    const listener = vi.fn()

    requestRecommendCompute('ci_xlarge')
    expect(listener).not.toHaveBeenCalled()

    subscribeRecommendCompute(listener)
    expect(listener).toHaveBeenCalledWith('ci_xlarge')
  })

  it('replaces the previous subscriber', () => {
    const first = vi.fn()
    const second = vi.fn()

    subscribeRecommendCompute(first)
    subscribeRecommendCompute(second)

    requestRecommendCompute('ci_xlarge')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('ci_xlarge')
  })
})
