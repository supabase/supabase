import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  requestRecommendCompute,
  subscribeRecommendCompute,
} from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/recommendCompute'

describe('recommendCompute bridge', () => {
  afterEach(() => {
    // Clear any leftover subscriber between tests.
    subscribeRecommendCompute(() => {})()
  })

  it('delivers the recommended size to the active subscriber', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRecommendCompute(listener)

    expect(requestRecommendCompute('ci_small')).toBe(true)
    expect(listener).toHaveBeenCalledWith('ci_small')

    unsubscribe()
    expect(requestRecommendCompute('ci_xlarge')).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('replaces the previous subscriber', () => {
    const first = vi.fn()
    const second = vi.fn()

    subscribeRecommendCompute(first)
    subscribeRecommendCompute(second)

    expect(requestRecommendCompute('ci_xlarge')).toBe(true)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('ci_xlarge')
  })
})
