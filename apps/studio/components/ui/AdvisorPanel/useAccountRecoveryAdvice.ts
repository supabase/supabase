import { useFlag, useUser } from 'common'

import { createAccountRecoveryAdvice } from './account-recovery-advice'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import { IS_PLATFORM } from '@/lib/constants'

export const useAccountRecoveryAdvice = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const isRecoveryCodesEnabled = useFlag('enableAuthRecoveryCodes')
  const shouldMockAdvice =
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mockAccountAdvisor') === 'exhausted'
  const userId = useUser()?.id
  const shouldReadAccount =
    IS_PLATFORM && isRecoveryCodesEnabled && enabled && !!userId && !shouldMockAdvice
  const factors = useMfaListFactorsQuery({ enabled: shouldReadAccount, userId })
  const identities = useProfileIdentitiesQuery({ enabled: shouldReadAccount, userId })
  const shouldReadCodes =
    shouldReadAccount &&
    factors.isSuccess &&
    factors.data.all.some(
      (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
    ) &&
    identities.isSuccess &&
    !identities.data.identities.some((identity) => identity.provider.startsWith('sso'))
  const recoveryCodes = useRecoveryCodesStatusQuery({ enabled: shouldReadCodes, userId })

  if (shouldMockAdvice && enabled) {
    return createAccountRecoveryAdvice({
      factors: [{ factor_type: 'totp', status: 'verified' }],
      identities: [{ provider: 'email' }],
      recoveryCodes: { status: 'available', data: { remaining: 0 } },
    })
  }

  if (!shouldReadCodes || !recoveryCodes.isSuccess) return undefined

  return createAccountRecoveryAdvice({
    factors: factors.data.all,
    identities: identities.data.identities,
    recoveryCodes: recoveryCodes.data,
  })
}
