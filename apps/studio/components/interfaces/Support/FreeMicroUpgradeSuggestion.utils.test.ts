import { describe, expect, it } from 'vitest'

import { isEligibleForFreeMicroUpgrade } from './FreeMicroUpgradeSuggestion.utils'

describe('isEligibleForFreeMicroUpgrade', () => {
  it.each(['pro', 'team', 'enterprise'] as const)('is eligible for nano on %s', (planId) => {
    expect(isEligibleForFreeMicroUpgrade({ planId, computeSize: 'nano' })).toBe(true)
  })

  it('is not eligible on the free plan', () => {
    expect(isEligibleForFreeMicroUpgrade({ planId: 'free', computeSize: 'nano' })).toBe(false)
  })

  it('is not eligible on larger compute sizes', () => {
    expect(isEligibleForFreeMicroUpgrade({ planId: 'pro', computeSize: 'micro' })).toBe(false)
  })

  it('is not eligible while the plan or compute size is unknown', () => {
    expect(isEligibleForFreeMicroUpgrade({ planId: undefined, computeSize: 'nano' })).toBe(false)
    expect(isEligibleForFreeMicroUpgrade({ planId: 'pro', computeSize: undefined })).toBe(false)
  })
})
