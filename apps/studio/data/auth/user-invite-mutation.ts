import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { useFlag } from 'hooks/ui/useFlag'

export type UserInviteVariables = {
  projectRef: string
  email: string
}

export async function inviteUser({ projectRef, email }: UserInviteVariables) {
  const response = await post(`${API_URL}/auth/${projectRef}/invite`, { email })
  if (response.error) throw response.error
  return response
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
  const userManagementV2 = useFlag('userManagementV2')

  return useMutation<UserInviteData, ResponseError, UserInviteVariables>(
    (vars) => inviteUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        if (userManagementV2) {
          await queryClient.invalidateQueries(authKeys.usersInfinite(projectRef))
        } else {
          await queryClient.invalidateQueries(authKeys.users(projectRef))
        }

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
