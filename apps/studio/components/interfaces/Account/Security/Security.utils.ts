import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

export type SecurityAction = AccountRecoveryFinding['action'] | 'enable-mfa'

const findingOrder: AccountRecoveryFinding['id'][] = [
  'recovery-codes-exhausted',
  'recovery-codes-missing',
  'recovery-codes-low',
  'single-oauth-identity',
  'single-mfa-factor',
]

export const getPrimarySecurityAction = ({
  findings,
  canEnableMfa,
  isPending,
  isError,
}: {
  findings: AccountRecoveryFinding[]
  canEnableMfa: boolean
  isPending: boolean
  isError: boolean
}): SecurityAction | undefined => {
  if (isPending || isError) return undefined
  const finding = findingOrder.map((id) => findings.find((item) => item.id === id)).find(Boolean)
  if (canEnableMfa) return 'enable-mfa'
  if (finding && finding.severity !== 'info') return finding.action
  return finding?.action
}
