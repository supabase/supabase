import { describe, expect, it } from 'vitest'

import { getPrimarySecurityAction } from '@/components/interfaces/Account/Security/Security.utils'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

const findings: AccountRecoveryFinding[] = [
  { id: 'single-oauth-identity', severity: 'warning', action: 'set-password' },
  { id: 'recovery-codes-exhausted', severity: 'critical', action: 'regenerate-codes' },
]

describe('getPrimarySecurityAction', () => {
  const base = { findings: [], canEnableMfa: false, isPending: false, isError: false }
  it('prioritizes exhausted codes over a password fallback regardless of ordering', () => {
    expect(getPrimarySecurityAction({ ...base, findings })).toBe('regenerate-codes')
    expect(getPrimarySecurityAction({ ...base, findings: [...findings].reverse() })).toBe(
      'regenerate-codes'
    )
  })
  it.each(['isPending', 'isError'] as const)('does not prioritize an action when %s', (state) => {
    expect(getPrimarySecurityAction({ ...base, findings, [state]: true })).toBeUndefined()
  })
  it('offers MFA setup without inventing a recovery finding', () => {
    expect(getPrimarySecurityAction({ ...base, canEnableMfa: true })).toBe('enable-mfa')
  })
  it('prioritizes a password gap before MFA setup', () => {
    expect(getPrimarySecurityAction({ ...base, canEnableMfa: true, findings: [findings[0]] })).toBe(
      'set-password'
    )
  })
  it('uses a backup authenticator recommendation after higher risks are resolved', () => {
    expect(
      getPrimarySecurityAction({
        ...base,
        findings: [{ id: 'single-mfa-factor', severity: 'info', action: 'add-factor' }],
      })
    ).toBe('add-factor')
    expect(getPrimarySecurityAction(base)).toBeUndefined()
  })
})
