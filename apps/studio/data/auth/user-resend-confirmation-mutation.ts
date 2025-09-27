import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, fetchPost } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

export type UserResendConfirmationVariables = {
  projectRef: string
  user: User
}

export async function resendSignup({ projectRef, user }: UserResendConfirmationVariables) {
  const response = await fetchPost(`/api/platform/auth/${projectRef}/resend`, {
    email: user.email,
    type: 'signup',
  })
  if ((response as any)?.error) handleError((response as any).error)
  return response
}

type UserResendConfirmationData = Awaited<ReturnType<typeof resendSignup>>

export const useUserResendConfirmationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    UserResendConfirmationData,
    ResponseError,
    UserResendConfirmationVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    UserResendConfirmationData,
    ResponseError,
    UserResendConfirmationVariables
  >((vars) => resendSignup(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to resend confirmation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
