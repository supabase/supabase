import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import type { User } from './users-query'

export type UserResetPasswordVariables = {
  projectRef: string
  user: User
}

export async function resetPassword({ projectRef, user }: UserResetPasswordVariables) {
  const response = await post(`${API_URL}/auth/${projectRef}/recover`, user)
  if (response.error) throw response.error
  return response
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
