import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'

export type RecoveryGap = 'missing' | 'exhausted'

export function getRecoveryGap(findings: AccountRecoveryFinding[]): RecoveryGap | null {
  if (findings.some((finding) => finding.id === 'recovery-codes-exhausted')) return 'exhausted'
  if (findings.some((finding) => finding.id === 'recovery-codes-missing')) return 'missing'
  return null
}

export function getRecoveryReturnTo(value: string | null, basePath = ''): string {
  const fallback = `${basePath}/organizations`
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) {
    return fallback
  }
  try {
    const url = new URL(value, 'https://studio.local')
    const pathname =
      basePath && (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`))
        ? url.pathname.slice(basePath.length) || '/'
        : url.pathname
    if (url.origin !== 'https://studio.local' || pathname === '/account-recovery') {
      return fallback
    }
    return `${basePath}${pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export function getMockRecoveryGap(
  value: string | null,
  isDevelopment: boolean,
  vercelEnvironment?: string
): RecoveryGap | null {
  if (!isDevelopment && vercelEnvironment !== 'preview') return null
  return value === 'missing' || value === 'exhausted' ? value : null
}
