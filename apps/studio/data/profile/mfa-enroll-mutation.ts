import type { AuthMFAEnrollResponse, MFAEnrollParams } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { toast } from 'react-hot-toast'

const mfaEnroll = async (params: MFAEnrollParams) => {
  const { error, data } = await auth.mfa.enroll(params)

  if (error) throw error
  return data
}

type CustomMFAEnrollResponse = NonNullable<AuthMFAEnrollResponse['data']>
type CustomMFAEnrollError = NonNullable<AuthMFAEnrollResponse['error']>

export const useMfaEnrollMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomMFAEnrollResponse, CustomMFAEnrollError, MFAEnrollParams>,
  'mutationFn'
> = {}) => {
  return useMutation((vars) => mfaEnroll(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to enroll factor: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
