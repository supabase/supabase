import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import type { User } from './users-query'

export type UserSendMagicLinkVariables = {
  projectRef: string
  user: User
}

export async function sendMagicLink({ projectRef, user }: UserSendMagicLinkVariables) {
  const response = await post(`${API_URL}/auth/${projectRef}/magiclink`, user)
  if (response.error) throw response.error
  return response
}

type UserSendMagicLinkData = Awaited<ReturnType<typeof sendMagicLink>>

export const useUserSendMagicLinkMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserSendMagicLinkData, ResponseError, UserSendMagicLinkVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserSendMagicLinkData, ResponseError, UserSendMagicLinkVariables>(
    (vars) => sendMagicLink(vars),
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
