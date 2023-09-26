import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { User } from './users-query'
import { authKeys } from './keys'

export type UserDeleteVariables = {
  projectRef: string
  user: User
}

export async function deleteUser({ projectRef, user }: UserDeleteVariables) {
  const response = await delete_(`${API_URL}/auth/${projectRef}/users`, user)
  if (response.error) throw response.error
  return response
}

type UserDeleteData = Awaited<ReturnType<typeof deleteUser>>

export const useUserDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserDeleteData, ResponseError, UserDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UserDeleteData, ResponseError, UserDeleteVariables>(
    (vars) => deleteUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(authKeys.users(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
