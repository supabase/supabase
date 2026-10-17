import { mapAccountRecoveryFindings } from './account-recovery-advice'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import {
  evaluateAccountRecovery,
  type AccountRecoveryInput,
} from '@/lib/account-recovery/evaluate-account-recovery'

type Preview = 'exhausted' | 'missing' | 'low' | 'single-identity' | 'single-factor'
const previewValues: Preview[] = ['exhausted', 'missing', 'low', 'single-identity', 'single-factor']

const previewInputs: Record<Preview, AccountRecoveryInput> = {
  exhausted: {
    identities: [{ provider: 'email' }],
    email: 'preview@example.com',
    verifiedFactorCount: 1,
    recoveryCodes: { status: 'available', remaining: 0 },
    features: { hasSecuritySettings: true, recoveryCodesEnabled: true, passwordEnabled: true },
  },
  missing: {
    identities: [{ provider: 'email' }],
    email: 'preview@example.com',
    verifiedFactorCount: 1,
    recoveryCodes: { status: 'missing' },
    features: { hasSecuritySettings: true, recoveryCodesEnabled: true, passwordEnabled: true },
  },
  low: {
    identities: [{ provider: 'email' }],
    email: 'preview@example.com',
    verifiedFactorCount: 1,
    recoveryCodes: { status: 'available', remaining: 2 },
    features: { hasSecuritySettings: true, recoveryCodesEnabled: true, passwordEnabled: true },
  },
  'single-identity': {
    identities: [{ provider: 'github' }],
    email: 'preview@example.com',
    verifiedFactorCount: 0,
    recoveryCodes: { status: 'unknown' },
    features: { hasSecuritySettings: true, recoveryCodesEnabled: true, passwordEnabled: true },
  },
  'single-factor': {
    identities: [{ provider: 'email' }],
    email: 'preview@example.com',
    verifiedFactorCount: 1,
    recoveryCodes: { status: 'available', remaining: 8 },
    features: { hasSecuritySettings: true, recoveryCodesEnabled: true, passwordEnabled: true },
  },
}

const getPreview = (): Preview | undefined => {
  const isPreviewEnabled =
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
  if (!isPreviewEnabled || typeof window === 'undefined') return undefined
  const value = new URLSearchParams(window.location.search).get('mockAccountAdvisor')
  return previewValues.find((preview) => preview === value)
}

export const useAccountRecoveryAdvice = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const preview = getPreview()
  const { findings } = useAccountRecovery({ enabled: enabled && !preview })

  if (!enabled) return []
  const activeFindings = preview ? evaluateAccountRecovery(previewInputs[preview]) : findings
  return mapAccountRecoveryFindings(activeFindings)
}
