import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type UserInviteVariables = {
  projectRef: string
  email: string
}

export async function inviteUser({ projectRef, email }: UserInviteVariables) {
  const { data, error } = await post('/platform/auth/{ref}/invite', {
    params: { path: { ref: projectRef } },
    body: { email },
  })
  if (error) handleError(error)
  return data
}

type UserInviteData = Awaited<ReturnType<typeof inviteUser>>

export const useUserInviteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserInviteData, ResponseError, UserInviteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserInviteData, ResponseError, UserInviteVariables>(
    (vars) => inviteUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
          queryClient.invalidateQueries(authKeys.usersInfinite(projectRef)),
          queryClient.invalidateQueries(authKeys.usersCount(projectRef)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to invite user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
