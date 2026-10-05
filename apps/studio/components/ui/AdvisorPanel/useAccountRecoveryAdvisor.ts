import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { getAccountRecoveryItem } from './AccountRecovery.utils'
import { profileKeys } from '@/data/profile/keys'
import { getMfaListFactors } from '@/data/profile/mfa-list-factors-query'
import { getProfileIdentities } from '@/data/profile/profile-identities-query'
import { recoveryCodeKeys } from '@/data/recovery-codes/keys'
import { getRecoveryCodesStatus } from '@/data/recovery-codes/recovery-codes-status-query'
import { IS_PLATFORM } from '@/lib/constants'

export const useAccountRecoveryAdvisor = ({ enabled }: { enabled: boolean }) => {
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')
  const canCheckAccount = enabled && IS_PLATFORM && enableAuthRecoveryCodes
  const identities = useQuery({
    queryKey: profileKeys.identities(),
    queryFn: getProfileIdentities,
    enabled: canCheckAccount,
  })
  const isManagedAccount = identities.data?.identities.some((identity) =>
    identity.provider.startsWith('sso')
  )
  const canCheckFactors = canCheckAccount && identities.isSuccess && !isManagedAccount
  const factors = useQuery({
    queryKey: profileKeys.mfaFactors(),
    queryFn: getMfaListFactors,
    enabled: canCheckFactors,
  })
  const verifiedFactorCount = factors.data?.all.filter(
    (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
  ).length
  const canCheckCodes = canCheckFactors && factors.isSuccess && verifiedFactorCount === 1
  const codes = useQuery({
    queryKey: recoveryCodeKeys.status(),
    queryFn: getRecoveryCodesStatus,
    enabled: canCheckCodes,
  })

  if (!canCheckCodes || !codes.isSuccess || verifiedFactorCount === undefined) return undefined
  const remainingCodes = codes.data.status === 'unenrolled' ? null : codes.data.data?.remaining
  if (remainingCodes === undefined) return undefined
  return getAccountRecoveryItem({ verifiedFactorCount, remainingCodes })
}
