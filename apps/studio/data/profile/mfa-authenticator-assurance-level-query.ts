import type { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js'
import { createQuery } from 'react-query-kit'

import { auth } from 'lib/gotrue'
import type { Profile } from './types'

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

export const useAuthenticatorAssuranceLevelQuery = createQuery<
  CustomAuthMFAGetAuthenticatorAssuranceLevelData,
  void,
  CustomAuthMFAGetAuthenticatorAssuranceLevelError
>({
  queryKey: ['mfa', 'aaLevel'],
  fetcher: getMfaAuthenticatorAssuranceLevel,
  staleTime: 1000 * 60 * 30, // default good for 30 mins
})
