import { useQuery } from '@tanstack/react-query'
import { useSession, useUser } from 'common'

import { recoveryCodeKeys } from './keys'
import { handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { auth } from '@/lib/gotrue'
import type { UseCustomQueryOptions } from '@/types'

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
export type RecoveryCodesError = StudioError

export const useRecoveryCodesStatusQuery = <TData = RecoveryCodesStatusData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<RecoveryCodesStatusData, RecoveryCodesError, TData> = {}) => {
  const userId = useUser()?.id
  // auth.mfa.recoveryCodes.getStatus() needs a session, so skip it when signed out
  const hasSession = useSession() !== null
  return useQuery<RecoveryCodesStatusData, RecoveryCodesError, TData>({
    queryKey: recoveryCodeKeys.status(userId),
    queryFn: () => getRecoveryCodesStatus(),
    staleTime: 1000 * 60 * 30,
    enabled: enabled && hasSession,
    ...options,
  })
}
