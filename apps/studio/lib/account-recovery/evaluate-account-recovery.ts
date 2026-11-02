export type AccountRecoveryFinding = {
  id:
    | 'recovery-codes-missing'
    | 'recovery-codes-exhausted'
    | 'recovery-codes-low'
    | 'single-mfa-factor'
    | 'single-oauth-identity'
  severity: 'critical' | 'warning' | 'info'
  action: 'generate-codes' | 'regenerate-codes' | 'set-password' | 'add-factor'
  remainingCodes?: number
}

export type AccountRecoveryInput = {
  identities: { provider: string }[]
  email?: string
  verifiedFactorCount: number
  recoveryCodes:
    | { status: 'unknown' }
    | { status: 'missing' }
    | { status: 'available'; remaining: number }
  features: {
    hasSecuritySettings: boolean
    recoveryCodesEnabled: boolean
    passwordEnabled: boolean
  }
}

export const evaluateAccountRecovery = ({
  identities,
  email,
  verifiedFactorCount,
  recoveryCodes,
  features,
}: AccountRecoveryInput): AccountRecoveryFinding[] => {
  if (identities.some((identity) => identity.provider.startsWith('sso'))) return []

  const findings: AccountRecoveryFinding[] = []
  const hasOneFactor = verifiedFactorCount === 1
  let hasCodeFinding = false

  if (features.hasSecuritySettings && features.recoveryCodesEnabled && verifiedFactorCount > 0) {
    if (recoveryCodes.status === 'missing') {
      findings.push({
        id: 'recovery-codes-missing',
        severity: 'warning',
        action: 'generate-codes',
      })
      hasCodeFinding = true
    } else if (recoveryCodes.status === 'available' && hasOneFactor) {
      if (recoveryCodes.remaining === 0) {
        findings.push({
          id: 'recovery-codes-exhausted',
          severity: 'critical',
          action: 'regenerate-codes',
          remainingCodes: 0,
        })
        hasCodeFinding = true
      } else if (recoveryCodes.remaining >= 1 && recoveryCodes.remaining <= 3) {
        findings.push({
          id: 'recovery-codes-low',
          severity: 'warning',
          action: 'regenerate-codes',
          remainingCodes: recoveryCodes.remaining,
        })
        hasCodeFinding = true
      }
    }
  }

  const isCodeStatusUnknown = features.recoveryCodesEnabled && recoveryCodes.status === 'unknown'
  if (features.hasSecuritySettings && hasOneFactor && !hasCodeFinding && !isCodeStatusUnknown) {
    findings.push({ id: 'single-mfa-factor', severity: 'info', action: 'add-factor' })
  }

  const hasOneOAuthIdentity =
    identities.length === 1 &&
    identities[0].provider !== 'email' &&
    identities[0].provider !== 'phone' &&
    !identities[0].provider.startsWith('sso')
  if (features.passwordEnabled && email && hasOneOAuthIdentity) {
    findings.push({ id: 'single-oauth-identity', severity: 'warning', action: 'set-password' })
  }

  return findings
}
