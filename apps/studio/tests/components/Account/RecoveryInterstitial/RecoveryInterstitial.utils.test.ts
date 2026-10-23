import { describe, expect, it } from 'vitest'

import { getRecoveryGap } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial.utils'

describe('account recovery reminder selection', () => {
  it.each([
    ['recovery-codes-missing', 'warning', 'generate-codes', 'missing'],
    ['recovery-codes-exhausted', 'critical', 'regenerate-codes', 'exhausted'],
  ] as const)('selects %s', (id, severity, action, expected) => {
    expect(getRecoveryGap([{ id, severity, action }])).toBe(expected)
  })
  it('prioritizes exhausted codes', () => {
    expect(
      getRecoveryGap([
        { id: 'recovery-codes-missing', severity: 'warning', action: 'generate-codes' },
        { id: 'recovery-codes-exhausted', severity: 'critical', action: 'regenerate-codes' },
      ])
    ).toBe('exhausted')
  })
  it('does not interrupt for other recovery findings', () => {
    expect(getRecoveryGap([])).toBeNull()
    expect(
      getRecoveryGap([
        {
          id: 'recovery-codes-low',
          severity: 'warning',
          action: 'regenerate-codes',
          remainingCodes: 2,
        },
        { id: 'single-mfa-factor', severity: 'info', action: 'add-factor' },
        { id: 'single-oauth-identity', severity: 'warning', action: 'set-password' },
      ])
    ).toBeNull()
  })
})
