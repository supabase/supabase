import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

export type UserResetPasswordVariables = {
  projectRef: string
  user: User
}

export async function resetPassword({ projectRef, user }: UserResetPasswordVariables) {
  const { data, error } = await post('/platform/auth/{ref}/recover', {
    params: { path: { ref: projectRef } },
    body: { email: user.email },
  })

  if (error) handleError(error)

  return data
}

type UserResetPasswordData = Awaited<ReturnType<typeof resetPassword>>

export const useUserResetPasswordMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserResetPasswordData, ResponseError, UserResetPasswordVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserResetPasswordData, ResponseError, UserResetPasswordVariables>(
    (vars) => resetPassword(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] If we need to invalidate any queries
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to reset user password: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
