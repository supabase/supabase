import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { API_URL } from 'lib/constants'
import { authKeys } from './keys'

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
  return useMutation<UserInviteData, ResponseError, UserInviteVariables>(
    (vars) => inviteUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(authKeys.users(projectRef))
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
