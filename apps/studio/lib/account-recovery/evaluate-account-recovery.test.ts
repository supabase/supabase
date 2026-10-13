import { describe, expect, it } from 'vitest'

import { evaluateAccountRecovery, type AccountRecoveryInput } from './evaluate-account-recovery'

const base: AccountRecoveryInput = {
  identities: [{ provider: 'email' }],
  email: 'person@example.com',
  verifiedFactorCount: 1,
  recoveryCodes: { status: 'available', remaining: 8 },
  features: { hasSecuritySettings: true, recoveryCodesEnabled: true, passwordEnabled: true },
}

const evaluate = (overrides: Partial<AccountRecoveryInput> = {}) =>
  evaluateAccountRecovery({ ...base, ...overrides })

describe('evaluateAccountRecovery', () => {
  it('suppresses all findings for SSO identities', () => {
    expect(
      evaluate({ identities: [{ provider: 'sso:provider' }], recoveryCodes: { status: 'missing' } })
    ).toEqual([])
  })

  it('finds missing codes with any verified MFA count and suppresses the factor reminder', () => {
    for (const verifiedFactorCount of [1, 2]) {
      expect(evaluate({ verifiedFactorCount, recoveryCodes: { status: 'missing' } })).toEqual([
        { id: 'recovery-codes-missing', severity: 'warning', action: 'generate-codes' },
      ])
    }
    expect(evaluate({ verifiedFactorCount: 0, recoveryCodes: { status: 'missing' } })).toEqual([])
  })

  it('finds exhausted codes only with one verified MFA factor', () => {
    expect(evaluate({ recoveryCodes: { status: 'available', remaining: 0 } })).toEqual([
      {
        id: 'recovery-codes-exhausted',
        severity: 'critical',
        action: 'regenerate-codes',
        remainingCodes: 0,
      },
    ])
    expect(
      evaluate({ verifiedFactorCount: 2, recoveryCodes: { status: 'available', remaining: 0 } })
    ).toEqual([])
  })

  it('uses the low-code boundary of one through three with one factor', () => {
    for (const remaining of [1, 2, 3]) {
      expect(evaluate({ recoveryCodes: { status: 'available', remaining } })).toEqual([
        {
          id: 'recovery-codes-low',
          severity: 'warning',
          action: 'regenerate-codes',
          remainingCodes: remaining,
        },
      ])
    }
    expect(evaluate({ recoveryCodes: { status: 'available', remaining: 4 } })).toEqual([
      { id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' },
    ])
    expect(
      evaluate({ verifiedFactorCount: 2, recoveryCodes: { status: 'available', remaining: 2 } })
    ).toEqual([])
  })

  it('waits for known code status before advising on a single MFA factor', () => {
    expect(evaluate({ recoveryCodes: { status: 'unknown' } })).toEqual([])
    expect(
      evaluate({
        recoveryCodes: { status: 'unknown' },
        features: { ...base.features, recoveryCodesEnabled: false },
      })
    ).toEqual([{ id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' }])
  })

  it('gates security findings but independently advises on a single OAuth sign-in', () => {
    const identities = [{ provider: 'github' }]
    expect(
      evaluate({
        identities,
        features: { ...base.features, hasSecuritySettings: false },
      })
    ).toEqual([{ id: 'single-oauth-identity', severity: 'warning', action: 'set-password' }])
    expect(evaluate({ identities: [...identities, { provider: 'google' }] })).toEqual([
      { id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' },
    ])
    expect(evaluate({ identities: [{ provider: 'phone' }] })).toEqual([
      { id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' },
    ])
    expect(evaluate({ identities, email: undefined })).toEqual([
      { id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' },
    ])
    expect(
      evaluate({ identities, features: { ...base.features, passwordEnabled: false } })
    ).toEqual([{ id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' }])
  })
})
