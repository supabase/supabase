import { describe, expect, it } from 'vitest'

import { shouldResetNuqsQueueOnNavigation } from './nuqs-queue-on-traverse'

describe('shouldResetNuqsQueueOnNavigation', () => {
  it('resets on Back even while a nuqs url update is in flight', () => {
    expect(shouldResetNuqsQueueOnNavigation({ isNuqsUpdate: true, isTraverse: true })).toBe(true)
  })

  it('resets on Back when nothing is writing', () => {
    expect(shouldResetNuqsQueueOnNavigation({ isNuqsUpdate: false, isTraverse: true })).toBe(true)
  })

  it("keeps a queued write across that write's own navigation", () => {
    expect(shouldResetNuqsQueueOnNavigation({ isNuqsUpdate: true, isTraverse: false })).toBe(false)
  })

  it('resets when a navigation was not started by nuqs', () => {
    expect(shouldResetNuqsQueueOnNavigation({ isNuqsUpdate: false, isTraverse: false })).toBe(true)
  })
})
