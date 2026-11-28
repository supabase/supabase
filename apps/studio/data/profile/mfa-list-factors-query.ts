import type { AuthMFAListFactorsResponse, Factor } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useSession, useUser } from 'common'

import { profileKeys } from './keys'
import { auth } from '@/lib/gotrue'
import { UseCustomQueryOptions } from '@/types'

export async function getMfaListFactors() {
  const { error, data } = await auth.mfa.listFactors()

  if (error) throw error
  return data
}

export type MFAFactor = Factor
type CustomMFAListFactorsData = NonNullable<AuthMFAListFactorsResponse['data']>
type CustomMFAListFactorsError = NonNullable<AuthMFAListFactorsResponse['error']>

export const useMfaListFactorsQuery = <TData = CustomMFAListFactorsData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<CustomMFAListFactorsData, CustomMFAListFactorsError, TData> = {}) => {
  const userId = useUser()?.id
  // auth.mfa.listFactors() errors with "Auth session missing" when signed out
  const hasSession = useSession() !== null
  return useQuery<CustomMFAListFactorsData, CustomMFAListFactorsError, TData>({
    queryKey: profileKeys.mfaFactors(userId),
    queryFn: () => getMfaListFactors(),
    staleTime: 1000 * 60 * 30,
    enabled: enabled && hasSession,
    ...options,
  })
}
