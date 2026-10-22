import type { AuthMFAListFactorsResponse, Factor } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useUser } from 'common'

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
  userId,
  ...options
}: UseCustomQueryOptions<CustomMFAListFactorsData, CustomMFAListFactorsError, TData> & {
  userId?: string
} = {}) => {
  const signedInUserId = useUser()?.id
  return useQuery<CustomMFAListFactorsData, CustomMFAListFactorsError, TData>({
    queryKey: profileKeys.mfaFactors(userId ?? signedInUserId),
    queryFn: () => getMfaListFactors(),
    staleTime: 1000 * 60 * 30,
    enabled,
    ...options,
  })
}
