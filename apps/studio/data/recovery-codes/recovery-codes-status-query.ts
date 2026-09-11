import { useQuery } from '@tanstack/react-query'

import { recoveryCodeKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { auth } from '@/lib/gotrue'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export async function getRecoveryCodesStatus() {
  const { data, error } = await auth.mfa.recoveryCodes.getStatus()
  // If users haven't enrolled yet, just return null so that UI does not retry the request and
  // offer to enroll
  if (error?.code === 'mfa_factor_not_found') {
    return { status: 'unenrolled', data: null } as const
  }
  if (error) handleError(error)

  return { status: 'available', data } as const
}

export type RecoveryCodesStatusData = Awaited<ReturnType<typeof getRecoveryCodesStatus>>
export type RecoveryCodesError = ResponseError

export const useRecoveryCodesStatusQuery = <TData = RecoveryCodesStatusData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<RecoveryCodesStatusData, RecoveryCodesError, TData> = {}) =>
  useQuery<RecoveryCodesStatusData, RecoveryCodesError, TData>({
    queryKey: recoveryCodeKeys.status(),
    queryFn: () => getRecoveryCodesStatus(),
    staleTime: 1000 * 60 * 30,
    ...options,
  })
