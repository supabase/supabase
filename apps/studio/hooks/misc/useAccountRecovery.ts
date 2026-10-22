import { useFlag, useUser } from 'common'

import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import {
  evaluateAccountRecovery,
  type AccountRecoveryInput,
} from '@/lib/account-recovery/evaluate-account-recovery'
import { IS_PLATFORM } from '@/lib/constants'

export const useAccountRecovery = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const userId = useUser()?.id
  const hasSecuritySettings = useIsFeatureEnabled('account:show_security_settings')
  const recoveryCodesEnabled = useFlag('enableAuthRecoveryCodes')
  const passwordEnabled = useFlag('enableAccountPassword')
  const shouldReadAccount = IS_PLATFORM && enabled && !!userId
  const identities = useProfileIdentitiesQuery({ enabled: shouldReadAccount, userId })
  const shouldReadFactors = shouldReadAccount && hasSecuritySettings
  const factors = useMfaListFactorsQuery({ enabled: shouldReadFactors, userId })
  const verifiedFactorCount = factors.isSuccess
    ? factors.data.all.filter(
        (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
      ).length
    : 0
  const isSsoAccount =
    identities.isSuccess &&
    identities.data.identities.some((identity) => identity.provider.startsWith('sso'))
  const shouldReadCodes =
    shouldReadFactors &&
    recoveryCodesEnabled &&
    factors.isSuccess &&
    verifiedFactorCount > 0 &&
    identities.isSuccess &&
    !isSsoAccount
  const codes = useRecoveryCodesStatusQuery({ enabled: shouldReadCodes, userId })

  const isPending =
    shouldReadAccount &&
    (identities.isPending ||
      (shouldReadFactors && factors.isPending) ||
      (shouldReadCodes && codes.isPending))
  const isError =
    shouldReadAccount &&
    (identities.isError ||
      (shouldReadFactors && factors.isError) ||
      (shouldReadCodes && codes.isError))

  let recoveryCodes: AccountRecoveryInput['recoveryCodes'] = { status: 'unknown' }
  if (shouldReadCodes && codes.isSuccess) {
    if (codes.data.status === 'unenrolled') recoveryCodes = { status: 'missing' }
    if (codes.data.status === 'available' && codes.data.data) {
      recoveryCodes = { status: 'available', remaining: codes.data.data.remaining }
    }
  }

  const findings =
    shouldReadAccount && identities.isSuccess
      ? evaluateAccountRecovery({
          identities: identities.data.identities,
          email: identities.data.email,
          verifiedFactorCount,
          recoveryCodes,
          features: {
            hasSecuritySettings: hasSecuritySettings && factors.isSuccess,
            recoveryCodesEnabled,
            passwordEnabled,
          },
        })
      : []

  return { findings, isPending, isError }
}
