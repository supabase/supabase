import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

export type UserSendOTPVariables = {
  projectRef: string
  user: User
}

export async function sendOTP({ projectRef, user }: UserSendOTPVariables) {
  const { data, error } = await post('/platform/auth/{ref}/otp', {
    params: { path: { ref: projectRef } },
    body: { phone: user.phone },
  })

  if (error) handleError(error)

  return data
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
