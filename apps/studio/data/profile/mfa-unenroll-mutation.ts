import type { AuthMFAUnenrollResponse, MFAUnenrollParams } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { toast } from 'sonner'
import { profileKeys } from './keys'
import type { UseCustomMutationOptions } from 'types'

interface MFAWebAuthnChallengeAndVerifyVariables extends MFAUnenrollParams {
  refreshFactors?: boolean
}

const mfaUnenroll = async (params: MFAUnenrollParams) => {
  const { error, data } = await auth.mfa.unenroll(params)

  if (error) throw error
  return data
}

type CustomMFAUnenrollResponse = NonNullable<AuthMFAUnenrollResponse['data']>
type CustomMFAUnenrollError = NonNullable<AuthMFAUnenrollResponse['error']>

export const useMfaUnenrollMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    CustomMFAUnenrollResponse,
    CustomMFAUnenrollError,
    MFAWebAuthnChallengeAndVerifyVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars) => mfaUnenroll(vars),
    async onSuccess(data, variables, context) {
      // when a factor is unenrolled, the aaLevel is bumped down if it's the last factor
      const refreshFactors = variables.refreshFactors ?? true

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.mfaFactors() }),
        queryClient.invalidateQueries({ queryKey: profileKeys.aaLevel() }),
      ])

      await Promise.all([
        ...(refreshFactors ? [queryClient.invalidateQueries(profileKeys.mfaFactors())] : []),
        ...(refreshFactors ? [queryClient.invalidateQueries(profileKeys.aaLevel())] : []),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete factor: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
