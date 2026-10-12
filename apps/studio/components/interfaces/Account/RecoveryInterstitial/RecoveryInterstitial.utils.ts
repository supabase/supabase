import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

export type RecoveryGap = 'missing' | 'exhausted'

export function getRecoveryGap(findings: AccountRecoveryFinding[]): RecoveryGap | null {
  if (findings.some((finding) => finding.id === 'recovery-codes-exhausted')) return 'exhausted'
  if (findings.some((finding) => finding.id === 'recovery-codes-missing')) return 'missing'
  return null
}

export function getRecoveryReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) {
    return '/organizations'
  }
  try {
    const url = new URL(value, 'https://studio.local')
    if (url.origin !== 'https://studio.local' || url.pathname === '/account-recovery') {
      return '/organizations'
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/organizations'
  }
}

export function getMockRecoveryGap(
  value: string | null,
  isDevelopment: boolean
): RecoveryGap | null {
  if (!isDevelopment) return null
  return value === 'missing' || value === 'exhausted' ? value : null
}
