import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

export type RecoveryGap = 'missing' | 'exhausted'

export function getRecoveryGap(findings: AccountRecoveryFinding[]): RecoveryGap | null {
  if (findings.some((finding) => finding.id === 'recovery-codes-exhausted')) return 'exhausted'
  if (findings.some((finding) => finding.id === 'recovery-codes-missing')) return 'missing'
  return null
}
