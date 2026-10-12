export type RecoveryGap = 'missing' | 'exhausted'

export function evaluateRecoveryGap({
  isEnabled,
  isReady,
  isManaged,
  verifiedFactorCount,
  remainingCodes,
}: {
  isEnabled: boolean
  isReady: boolean
  isManaged: boolean
  verifiedFactorCount: number
  remainingCodes: number | null
}): RecoveryGap | null {
  if (!isEnabled || !isReady || isManaged || verifiedFactorCount !== 1) return null
  if (remainingCodes === null) return 'missing'
  if (remainingCodes === 0) return 'exhausted'
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
