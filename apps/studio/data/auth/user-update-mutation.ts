import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type UserUpdateVariables = {
  projectRef: string
  userId: string
  // For now just support updating banning the user
  banDuration: number | 'none' // In hours,  "none" to unban, otherwise a string in hours e.g "24h"
}

export async function updateUser({ projectRef, userId, banDuration }: UserUpdateVariables) {
  const { data, error } = await patch('/platform/auth/{ref}/users/{id}', {
    params: { path: { ref: projectRef, id: userId } },
    body: { ban_duration: typeof banDuration === 'number' ? `${banDuration}h` : banDuration },
  })

  if (error) handleError(error)
  return data
}

type UserUpdateData = Awaited<ReturnType<typeof updateUser>>

export const useUserUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserUpdateData, ResponseError, UserUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserUpdateData, ResponseError, UserUpdateVariables>(
    (vars) => updateUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(authKeys.usersInfinite(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
