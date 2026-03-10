import type { AuthMFAVerifyResponse, MFAChallengeAndVerifyParams } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { captureCriticalError } from 'lib/error-reporting'
import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'
import { UseCustomMutationOptions } from 'types'

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
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    CustomMFAVerifyResponse,
    CustomMFAVerifyError,
    MFAChallengeAndVerifyVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars) => {
      const { refreshFactors, ...params } = vars
      return mfaChallengeAndVerify(params)
    },
    async onSuccess(data, variables, context) {
      // when an MFA is added, the aaLevel is bumped up
      const refreshFactors = variables.refreshFactors ?? true

      await Promise.all([
        ...(refreshFactors
          ? [queryClient.invalidateQueries({ queryKey: profileKeys.mfaFactors() })]
          : []),
        queryClient.invalidateQueries({ queryKey: profileKeys.aaLevel() }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to sign in: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'sign in via MFA')
    },
    ...options,
  })
}
