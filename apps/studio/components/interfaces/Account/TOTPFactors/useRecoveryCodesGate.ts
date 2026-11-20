import { useFlag } from 'common'

import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'

/**
 * Recovery code state that gates removing an MFA method. The status query is shared through the
 * query cache, so every caller sees the same data without it being passed down as props.
 */
export const useRecoveryCodesGate = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')
  const isActive = enableAuthRecoveryCodes && enabled

  const { data, error, isError, isPending, isFetching, refetch } = useRecoveryCodesStatusQuery({
    enabled: isActive,
  })
  const { data: codes, status } = data ?? {}

  return {
    isActive,
    codes,
    status,
    error,
    isError,
    isPending,
    isFetching,
    refetch,
    hasRecoveryCodes: status === 'available',
    canUseRecoveryCodes: isActive && status === 'available' && !!codes && codes.remaining > 0,
    // Removing an MFA method requires knowing the recovery code status first
    canRemoveFactor: !(isActive && (isPending || isFetching || isError || !status)),
  }
}
