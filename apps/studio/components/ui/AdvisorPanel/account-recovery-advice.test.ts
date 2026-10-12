import { describe, expect, it } from 'vitest'

import { createAccountRecoveryAdvice } from './account-recovery-advice'

const oneFactor = [{ factor_type: 'totp' as const, status: 'verified' as const }]
const twoFactors = [...oneFactor, ...oneFactor]
const identities = [{ provider: 'email' }]

describe('createAccountRecoveryAdvice', () => {
  it('requires a verified factor and excludes SSO managed accounts', () => {
    expect(
      createAccountRecoveryAdvice({
        factors: [{ factor_type: 'totp', status: 'unverified' }],
        identities,
        recoveryCodes: { status: 'unenrolled' },
      })
    ).toBeUndefined()
    expect(
      createAccountRecoveryAdvice({
        factors: [{ factor_type: 'recovery_code', status: 'verified' }],
        identities,
        recoveryCodes: { status: 'unenrolled' },
      })
    ).toBeUndefined()
    expect(
      createAccountRecoveryAdvice({
        factors: oneFactor,
        identities: [{ provider: 'sso:example' }],
        recoveryCodes: { status: 'unenrolled' },
      })
    ).toBeUndefined()
  })

  it('makes missing and exhausted codes critical only without a second factor', () => {
    for (const recoveryCodes of [
      { status: 'unenrolled' as const },
      { status: 'available' as const, data: { remaining: 0 } },
    ]) {
      expect(
        createAccountRecoveryAdvice({ factors: oneFactor, identities, recoveryCodes })?.severity
      ).toBe('critical')
      expect(
        createAccountRecoveryAdvice({ factors: twoFactors, identities, recoveryCodes })?.severity
      ).toBe('warning')
    }
  })

  it('uses account-scoped signal types and the matching Security action', () => {
    const cases = [
      {
        recoveryCodes: { status: 'unenrolled' as const },
        type: 'recovery-codes-missing',
        label: 'Generate recovery codes',
      },
      {
        recoveryCodes: { status: 'available' as const, data: { remaining: 0 } },
        type: 'recovery-codes-exhausted',
        label: 'Regenerate recovery codes',
      },
      {
        recoveryCodes: { status: 'available' as const, data: { remaining: 1 } },
        type: 'recovery-codes-low',
        label: 'Review recovery codes',
      },
    ]

    for (const item of cases) {
      const advice = createAccountRecoveryAdvice({
        factors: oneFactor,
        identities,
        recoveryCodes: item.recoveryCodes,
      })
      expect(advice).toMatchObject({
        source: 'signal',
        scope: 'account',
        type: item.type,
        actions: [{ label: item.label, href: '/account/security#recovery-codes' }],
      })
    }
  })

  it('treats one code as a recommendation and clears advice after replenishment', () => {
    expect(
      createAccountRecoveryAdvice({
        factors: oneFactor,
        identities,
        recoveryCodes: { status: 'available', data: { remaining: 1 } },
      })?.severity
    ).toBe('info')
    expect(
      createAccountRecoveryAdvice({
        factors: oneFactor,
        identities,
        recoveryCodes: { status: 'available', data: { remaining: 2 } },
      })
    ).toBeUndefined()
    expect(
      createAccountRecoveryAdvice({
        factors: oneFactor,
        identities,
        recoveryCodes: { status: 'available', data: null },
      })
    ).toBeUndefined()
  })
})
