import { describe, expect, it } from 'vitest'

import { isFileSizeReducedBySpendCap } from './StorageSettings.utils'

const GB = 1024 * 1024 * 1024

const proWithSpendCap = {
  planId: 'pro',
  isUsageBillingEnabled: false,
  isEntitlementUnlimited: false,
}

describe('isFileSizeReducedBySpendCap', () => {
  it('is true when the entitled max is below 500 GB', () => {
    expect(isFileSizeReducedBySpendCap({ ...proWithSpendCap, entitledMaxBytes: 50 * GB })).toBe(
      true
    )
  })

  it('is false when the entitled max is already 500 GB', () => {
    expect(isFileSizeReducedBySpendCap({ ...proWithSpendCap, entitledMaxBytes: 500 * GB })).toBe(
      false
    )
  })

  it('is false when the entitlement value is unknown', () => {
    expect(isFileSizeReducedBySpendCap({ ...proWithSpendCap, entitledMaxBytes: undefined })).toBe(
      false
    )
  })

  it('is false when the entitlement is unlimited', () => {
    expect(
      isFileSizeReducedBySpendCap({
        ...proWithSpendCap,
        entitledMaxBytes: 0,
        isEntitlementUnlimited: true,
      })
    ).toBe(false)
  })

  it('is false when spend cap is off', () => {
    expect(
      isFileSizeReducedBySpendCap({
        ...proWithSpendCap,
        isUsageBillingEnabled: true,
        entitledMaxBytes: 50 * GB,
      })
    ).toBe(false)
  })

  it('is false on non-Pro plans', () => {
    expect(
      isFileSizeReducedBySpendCap({ ...proWithSpendCap, planId: 'team', entitledMaxBytes: 50 * GB })
    ).toBe(false)
  })
})
