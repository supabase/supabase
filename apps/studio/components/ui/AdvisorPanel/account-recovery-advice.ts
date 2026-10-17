import type { AdvisorAccountItem } from './AdvisorPanel.types'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

const recoveryCodesHref = '/account/security#recovery-codes'

export const mapAccountRecoveryFindings = (
  findings: AccountRecoveryFinding[]
): AdvisorAccountItem[] =>
  findings.map((finding) => {
    const base = {
      id: `account:${finding.id}`,
      source: 'signal' as const,
      scope: 'account' as const,
      type: finding.id,
      category: 'security' as const,
      severity: finding.severity,
    }

    switch (finding.id) {
      case 'recovery-codes-missing':
        return {
          ...base,
          title: 'Generate account recovery codes',
          summary:
            'Your account has no recovery codes. Generate codes and store them somewhere safe so you can sign in if you lose access to an authenticator app.',
          actions: [{ label: 'Generate recovery codes', href: recoveryCodesHref }],
        }
      case 'recovery-codes-exhausted':
        return {
          ...base,
          title: 'Regenerate account recovery codes',
          summary:
            'Your account has no unused recovery codes. Regenerate them and store the new codes somewhere safe.',
          actions: [{ label: 'Regenerate recovery codes', href: recoveryCodesHref }],
        }
      case 'recovery-codes-low':
        return {
          ...base,
          title: 'Regenerate account recovery codes',
          summary: `Your account has ${finding.remainingCodes} unused recovery ${finding.remainingCodes === 1 ? 'code' : 'codes'}. Regenerate codes before you need them.`,
          actions: [{ label: 'Regenerate recovery codes', href: recoveryCodesHref }],
        }
      case 'single-mfa-factor':
        return {
          ...base,
          title: 'Add a backup MFA method',
          summary:
            'Your account has one verified MFA method. Add a backup method on another device in case you lose access to the first.',
          actions: [{ label: 'Review multi-factor authentication', href: '/account/security' }],
        }
      case 'single-oauth-identity':
        return {
          ...base,
          title: 'Add a password to your account',
          summary:
            'Your account has one external sign-in method. Add a password so you have another way to sign in.',
          actions: [{ label: 'Add a password', href: '/reset-password?type=change' }],
        }
    }
  })
