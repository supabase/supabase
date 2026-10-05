import { describe, expect, it } from 'vitest'

import { getAccountRecoveryItem } from './AccountRecovery.utils'

describe('getAccountRecoveryItem', () => {
  it.each([0, 2, 3])('does not warn with %i verified authenticators', (verifiedFactorCount) => {
    expect(getAccountRecoveryItem({ verifiedFactorCount, remainingCodes: 0 })).toBeUndefined()
  })

  it('does not warn when more than three codes remain', () => {
    expect(getAccountRecoveryItem({ verifiedFactorCount: 1, remainingCodes: 4 })).toBeUndefined()
  })

  it.each([1, 2, 3])('warns when %i codes remain', (remainingCodes) => {
    expect(getAccountRecoveryItem({ verifiedFactorCount: 1, remainingCodes })).toMatchObject({
      severity: 'warning',
      action: { href: '/account/security#recovery-codes' },
    })
  })

  it('prioritises exhausted codes as critical', () => {
    expect(getAccountRecoveryItem({ verifiedFactorCount: 1, remainingCodes: 0 })).toMatchObject({
      severity: 'critical',
      title: 'You have no recovery codes left',
    })
  })

  it('offers initial generation when codes have never been enrolled', () => {
    expect(getAccountRecoveryItem({ verifiedFactorCount: 1, remainingCodes: null })).toMatchObject({
      severity: 'warning',
      action: { label: 'Generate recovery codes' },
    })
  })
})
