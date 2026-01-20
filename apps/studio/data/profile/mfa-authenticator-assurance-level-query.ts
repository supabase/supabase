import type { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'
import type { Profile } from './types'
import { UseCustomQueryOptions } from 'types'

export type ProfileResponse = Profile

export async function getMfaAuthenticatorAssuranceLevel() {
  const { error, data } = await auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) throw error
  return data
}

type CustomAuthMFAGetAuthenticatorAssuranceLevelData = NonNullable<
  AuthMFAGetAuthenticatorAssuranceLevelResponse['data']
>
type CustomAuthMFAGetAuthenticatorAssuranceLevelError = NonNullable<
  AuthMFAGetAuthenticatorAssuranceLevelResponse['error']
>

export const useAuthenticatorAssuranceLevelQuery = <
  TData = CustomAuthMFAGetAuthenticatorAssuranceLevelData,
>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<
  CustomAuthMFAGetAuthenticatorAssuranceLevelData,
  CustomAuthMFAGetAuthenticatorAssuranceLevelError,
  TData
> = {}) => {
  return useQuery<
    CustomAuthMFAGetAuthenticatorAssuranceLevelData,
    CustomAuthMFAGetAuthenticatorAssuranceLevelError,
    TData
  >({
    queryKey: profileKeys.aaLevel(),
    queryFn: () => getMfaAuthenticatorAssuranceLevel(),
    staleTime: 1000 * 60 * 30,
    ...options,
  })
}
