import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { authKeys } from './keys'

export type UserDeleteVariables = {
  projectRef: string
  userId: string
  skipInvalidation?: boolean
}

export async function deleteUser({ projectRef, userId }: UserDeleteVariables) {
  const { data, error } = await del('/platform/auth/{ref}/users/{id}', {
    params: { path: { ref: projectRef, id: userId } },
  })
  if (error) handleError(error)
  return data
}

type UserDeleteData = Awaited<ReturnType<typeof deleteUser>>

export const useUserDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UserDeleteData, ResponseError, UserDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserDeleteData, ResponseError, UserDeleteVariables>({
    mutationFn: (vars) => deleteUser(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, skipInvalidation = false } = variables

      if (!skipInvalidation) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: authKeys.usersInfinite(projectRef) }),
        ])
      }

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
  })
}
