import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

export type UserSendConfirmationVariables = {
  projectRef: string
  user: User
}

export async function sendConfirmation({ projectRef, user }: UserSendConfirmationVariables) {
  const { data, error } = await post('/platform/auth/{ref}/confirmation' as any, {
    params: { path: { ref: projectRef } },
    body: { email: user.email },
  })

  if (error) handleError(error)

  return data
}

type UserSendConfirmationData = Awaited<ReturnType<typeof sendConfirmation>>

export const useUserSendConfirmationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserSendConfirmationData, ResponseError, UserSendConfirmationVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserSendConfirmationData, ResponseError, UserSendConfirmationVariables>(
    (vars) => sendConfirmation(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to send confirmation email: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}