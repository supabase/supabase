import { AuthMFAVerifyResponse, MFAChallengeAndVerifyParams } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

export const mfaChallengeAndVerify = async (params: MFAChallengeAndVerifyParams) => {
  const { error, data } = await auth.mfa.challengeAndVerify(params)

  if (error) throw error
  return data
}

type CustomMFAVerifyResponse = NonNullable<AuthMFAVerifyResponse['data']>
type CustomMFAVerifyError = NonNullable<AuthMFAVerifyResponse['error']>

export const useMfaChallengeAndVerifyMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<CustomMFAVerifyResponse, CustomMFAVerifyError, MFAChallengeAndVerifyParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation((vars) => mfaChallengeAndVerify(vars), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(profileKeys.mfaFactors())
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
