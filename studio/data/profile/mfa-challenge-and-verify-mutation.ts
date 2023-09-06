import { AuthMFAVerifyResponse, MFAChallengeAndVerifyParams } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

interface MFAChallengeAndVerifyVariables extends MFAChallengeAndVerifyParams {
  refreshFactors?: boolean
}

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
  UseMutationOptions<CustomMFAVerifyResponse, CustomMFAVerifyError, MFAChallengeAndVerifyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    (vars) => {
      const { refreshFactors, ...params } = vars
      return mfaChallengeAndVerify(params)
    },
    {
      async onSuccess(data, variables, context) {
        // when a MFA is added, the aaLevel is bumped up
        const refreshFactors = variables.refreshFactors ?? true

        await Promise.all([
          ...(refreshFactors ? [queryClient.invalidateQueries(profileKeys.mfaFactors())] : []),
          queryClient.invalidateQueries(profileKeys.aaLevel()),
        ])

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
