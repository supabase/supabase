import { AuthMFAUnenrollResponse, MFAUnenrollParams } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'
import { toast } from 'react-hot-toast'

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
  UseMutationOptions<CustomMFAUnenrollResponse, CustomMFAUnenrollError, MFAUnenrollParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation((vars) => mfaUnenroll(vars), {
    async onSuccess(data, variables, context) {
      // when a factor is unenrolled, the aaLevel is bumped down if it's the last factor
      await Promise.all([
        queryClient.invalidateQueries(profileKeys.mfaFactors()),
        queryClient.invalidateQueries(profileKeys.aaLevel()),
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
