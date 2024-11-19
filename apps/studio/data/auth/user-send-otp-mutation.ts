import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

export type UserSendOTPVariables = {
  projectRef: string
  user: User
}

export async function sendOTP({ projectRef, user }: UserSendOTPVariables) {
  const response = await post(`${API_URL}/auth/${projectRef}/otp`, user)
  if (response.error) throw response.error
  return response
}

type UserSendOTPData = Awaited<ReturnType<typeof sendOTP>>

export const useUserSendOTPMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserSendOTPData, ResponseError, UserSendOTPVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserSendOTPData, ResponseError, UserSendOTPVariables>(
    (vars) => sendOTP(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] If we need to invalidate any queries
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to send magic link: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
