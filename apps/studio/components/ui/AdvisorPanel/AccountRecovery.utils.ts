import type { AdvisorAccountRecoveryItem } from './AdvisorPanel.types'

export const getAccountRecoveryItem = ({
  verifiedFactorCount,
  remainingCodes,
}: {
  verifiedFactorCount: number
  remainingCodes: number | null
}): AdvisorAccountRecoveryItem | undefined => {
  if (verifiedFactorCount !== 1 || (remainingCodes !== null && remainingCodes > 3)) return

  const isExhausted = remainingCodes === 0
  const hasNoCodes = remainingCodes === null
  let title = 'Your recovery codes are running low'
  let summary = `You have ${remainingCodes} recovery codes remaining. Generate a new set so you can sign in if you lose access to your authenticator.`
  if (isExhausted) {
    title = 'You have no recovery codes left'
    summary = 'Generate a new set so you can sign in if you lose access to your only authenticator.'
  } else if (hasNoCodes) {
    title = 'Save recovery codes for your account'
    summary =
      'You have one authenticator and no recovery codes. Save codes so you can sign in if you lose access to your authenticator.'
  }

  return {
    id: 'signal:account-recovery',
    source: 'signal',
    type: 'account-recovery',
    category: 'security',
    severity: isExhausted ? 'critical' : 'warning',
    title,
    summary,
    action: {
      label: hasNoCodes ? 'Generate recovery codes' : 'Generate new recovery codes',
      href: '/account/security#recovery-codes',
    },
  }
}
