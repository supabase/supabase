import type { AdvisorAccountItem } from './AdvisorPanel.types'
import type { MFAFactor } from '@/data/profile/mfa-list-factors-query'

type AccountRecoveryAdviceInput = {
  factors: Pick<MFAFactor, 'factor_type' | 'status'>[]
  identities: { provider: string }[]
  recoveryCodes:
    | { status: 'unenrolled' }
    | { status: 'available'; data: { remaining: number } | null }
}

export const createAccountRecoveryAdvice = ({
  factors,
  identities,
  recoveryCodes,
}: AccountRecoveryAdviceInput): AdvisorAccountItem | undefined => {
  if (identities.some((identity) => identity.provider.startsWith('sso'))) return undefined

  const verifiedFactorCount = factors.filter(
    (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
  ).length
  if (verifiedFactorCount === 0) return undefined

  const hasInsufficientBackupFactors = verifiedFactorCount < 2
  const availableCodes =
    recoveryCodes.status === 'available' ? recoveryCodes.data?.remaining : undefined

  if (recoveryCodes.status === 'unenrolled') {
    return {
      id: 'account:recovery-codes-missing',
      source: 'signal',
      scope: 'account',
      type: 'recovery-codes-missing',
      category: 'security',
      severity: hasInsufficientBackupFactors ? 'critical' : 'warning',
      title: 'Generate account recovery codes',
      summary:
        'Your account has no recovery codes. Generate codes and store them somewhere safe so you can sign in if you lose access to an authenticator app.',
      actions: [{ label: 'Generate recovery codes', href: '/account/security#recovery-codes' }],
    }
  }

  if (availableCodes === 0) {
    return {
      id: 'account:recovery-codes-exhausted',
      source: 'signal',
      scope: 'account',
      type: 'recovery-codes-exhausted',
      category: 'security',
      severity: hasInsufficientBackupFactors ? 'critical' : 'warning',
      title: 'Regenerate account recovery codes',
      summary:
        'Your account has no unused recovery codes. Regenerate them and store the new codes somewhere safe.',
      actions: [{ label: 'Regenerate recovery codes', href: '/account/security#recovery-codes' }],
    }
  }

  // One remaining code merits a reminder, but still provides a recovery path.
  if (availableCodes === 1) {
    return {
      id: 'account:recovery-codes-low',
      source: 'signal',
      scope: 'account',
      type: 'recovery-codes-low',
      category: 'security',
      severity: 'info',
      title: 'Review account recovery codes',
      summary:
        'Your account has one unused recovery code. Consider regenerating codes before you need them.',
      actions: [{ label: 'Review recovery codes', href: '/account/security#recovery-codes' }],
    }
  }

  return undefined
}
