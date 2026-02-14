import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { authKeys } from './keys'

export type UserCreateVariables = {
  projectRef: string
  user: {
    email: string
    password: string
    autoConfirmUser: boolean
  }
}

export async function createUser({ projectRef, user }: UserCreateVariables) {
  const { data, error } = await post('/platform/auth/{ref}/users', {
    params: { path: { ref: projectRef } },
    body: {
      email: user.email,
      password: user.password,
      email_confirm: user.autoConfirmUser,
    },
  })
  if (error) handleError(error)
  return data
}

type UserCreateData = Awaited<ReturnType<typeof createUser>>

export const useUserCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UserCreateData, ResponseError, UserCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserCreateData, ResponseError, UserCreateVariables>({
    mutationFn: (vars) => createUser(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.usersInfinite(projectRef) }),
        queryClient.invalidateQueries({ queryKey: authKeys.usersCount(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create user: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
