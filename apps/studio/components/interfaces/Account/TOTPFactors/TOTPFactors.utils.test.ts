import { describe, expect, it } from 'vitest'

import { shouldShowLockoutWarning } from './TOTPFactors.utils'

const oneFactor = {
  isFactorsSuccess: true,
  totpFactorsCount: 1,
  isRecoveryCodesEnabled: true,
  recoveryCodesStatus: { status: 'unenrolled', data: null },
  isRecoveryCodesPending: false,
  isRecoveryCodesError: false,
} as const

describe('shouldShowLockoutWarning', () => {
  it('shows when recovery codes are missing or exhausted', () => {
    expect(shouldShowLockoutWarning(oneFactor)).toBe(true)
    expect(
      shouldShowLockoutWarning({
        ...oneFactor,
        recoveryCodesStatus: { status: 'available', data: { remaining: 0 } },
      })
    ).toBe(true)
  })

  it('does not warn when usable recovery codes exist', () => {
    expect(
      shouldShowLockoutWarning({
        ...oneFactor,
        recoveryCodesStatus: { status: 'available', data: { remaining: 1 } },
      })
    ).toBe(false)
  })

  it('does not infer missing codes while status is pending, errored, or unknown', () => {
    expect(shouldShowLockoutWarning({ ...oneFactor, isRecoveryCodesPending: true })).toBe(false)
    expect(shouldShowLockoutWarning({ ...oneFactor, isRecoveryCodesError: true })).toBe(false)
    expect(shouldShowLockoutWarning({ ...oneFactor, recoveryCodesStatus: undefined })).toBe(false)
  })

  it('recommends a backup factor when recovery codes are disabled', () => {
    expect(shouldShowLockoutWarning({ ...oneFactor, isRecoveryCodesEnabled: false })).toBe(true)
  })

  it('requires one confirmed TOTP factor', () => {
    expect(shouldShowLockoutWarning({ ...oneFactor, isFactorsSuccess: false })).toBe(false)
    expect(shouldShowLockoutWarning({ ...oneFactor, totpFactorsCount: 0 })).toBe(false)
    expect(shouldShowLockoutWarning({ ...oneFactor, totpFactorsCount: 2 })).toBe(false)
  })
})
