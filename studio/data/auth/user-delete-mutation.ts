import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { User } from 'components/interfaces/Auth/Users/Users.types'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'

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
  return useMutation<UserDeleteData, ResponseError, UserDeleteVariables>(
    (vars) => deleteUser(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] If we need to invalidate any queries
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
