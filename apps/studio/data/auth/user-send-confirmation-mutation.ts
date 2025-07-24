import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

export type UserSendConfirmationVariables = {
  projectRef: string
  user: User
}

export async function sendConfirmation({ projectRef, user }: UserSendConfirmationVariables) {
  if (!user.email) {
    throw new Error('User email is required')
  }

  const url = `/platform/auth/${projectRef}/confirmation`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to send confirmation email')
  }

  return await response.json()
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