import { useFlag, useUser } from 'common'

import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import {
  evaluateAccountRecovery,
  type AccountRecoveryInput,
} from '@/lib/account-recovery/evaluate-account-recovery'
import { IS_PLATFORM } from '@/lib/constants'

export const useAccountRecovery = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const userId = useUser()?.id
  const recoveryCodesEnabled = useFlag('enableAuthRecoveryCodes')
  const passwordEnabled = useFlag('enableAccountPassword')
  const shouldReadAccount = IS_PLATFORM && enabled && !!userId
  const identities = useProfileIdentitiesQuery({ enabled: shouldReadAccount })
  const factors = useMfaListFactorsQuery({ enabled: shouldReadAccount })
  const verifiedFactorCount = factors.isSuccess
    ? factors.data.all.filter(
        (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
      ).length
    : 0
  const isSsoAccount =
    identities.isSuccess &&
    identities.data.identities.some((identity) => identity.provider.startsWith('sso'))
  const shouldReadCodes =
    shouldReadAccount &&
    recoveryCodesEnabled &&
    factors.isSuccess &&
    verifiedFactorCount > 0 &&
    identities.isSuccess &&
    !isSsoAccount
  const codes = useRecoveryCodesStatusQuery({ enabled: shouldReadCodes })

  const isPending =
    shouldReadAccount &&
    (identities.isPending || factors.isPending || (shouldReadCodes && codes.isPending))
  const isError =
    shouldReadAccount &&
    (identities.isError || factors.isError || (shouldReadCodes && codes.isError))

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
            recoveryCodesEnabled,
            passwordEnabled,
          },
        })
      : []

  const isFetching =
    shouldReadAccount &&
    (identities.isFetching || factors.isFetching || (shouldReadCodes && codes.isFetching))

  return {
    findings,
    isPending,
    isFetching,
    isError,
    verifiedFactorCount,
    isFactorsSuccess: shouldReadAccount && factors.isSuccess,
  }
}
