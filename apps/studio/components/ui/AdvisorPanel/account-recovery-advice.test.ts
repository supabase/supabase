import { describe, expect, it } from 'vitest'

import { mapAccountRecoveryFindings } from './account-recovery-advice'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

const findings: AccountRecoveryFinding[] = [
  { id: 'recovery-codes-missing', severity: 'warning', action: 'generate-codes' },
  {
    id: 'recovery-codes-exhausted',
    severity: 'critical',
    action: 'regenerate-codes',
    remainingCodes: 0,
  },
  {
    id: 'recovery-codes-low',
    severity: 'warning',
    action: 'regenerate-codes',
    remainingCodes: 2,
  },
  { id: 'single-mfa-factor', severity: 'info', action: 'add-factor' },
  { id: 'single-oauth-identity', severity: 'warning', action: 'set-password' },
]

describe('mapAccountRecoveryFindings', () => {
  it('maps all shared finding types to account signals with stable IDs', () => {
    const items = mapAccountRecoveryFindings(findings)

    expect(
      items.map(({ id, type, source, scope, severity }) => ({ id, type, source, scope, severity }))
    ).toEqual(
      findings.map((finding) => ({
        id: `account:${finding.id}`,
        type: finding.id,
        source: 'signal',
        scope: 'account',
        severity: finding.severity,
      }))
    )
    expect(items.every((item) => !('dismissalKey' in item))).toBe(true)
  })

  it('links each finding to an action available for that account state', () => {
    expect(mapAccountRecoveryFindings(findings).map((item) => item.actions[0])).toEqual([
      { label: 'Generate recovery codes', href: '/account/security#recovery-codes' },
      { label: 'Regenerate recovery codes', href: '/account/security#recovery-codes' },
      { label: 'Regenerate recovery codes', href: '/account/security#recovery-codes' },
      { label: 'Review multi-factor authentication', href: '/account/security' },
      { label: 'Add a password', href: '/reset-password?type=change' },
    ])
  })

  it('includes the remaining recovery code count in low-code advice', () => {
    const [item] = mapAccountRecoveryFindings([findings[2]])
    expect(item.summary).toContain('2 unused recovery codes')
  })
})
