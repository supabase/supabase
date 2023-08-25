import { AuthMFAEnrollResponse, MFAEnrollParams } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'

const mfaEnroll = async (params: MFAEnrollParams) => {
  const { error, data } = await auth.mfa.enroll(params)

  if (error) throw error
  return data
}

type CustomMFAEnrollResponse = NonNullable<AuthMFAEnrollResponse['data']>
type CustomMFAEnrollError = NonNullable<AuthMFAEnrollResponse['error']>

export const useMfaEnrollMutation = ({
  ...options
}: Omit<
  UseMutationOptions<CustomMFAEnrollResponse, CustomMFAEnrollError, MFAEnrollParams>,
  'mutationFn'
> = {}) => {
  return useMutation((vars) => mfaEnroll(vars), { ...options })
}
