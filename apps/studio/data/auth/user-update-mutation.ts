import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useFlag } from 'hooks/ui/useFlag'
import { put } from 'lib/common/fetch'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type UserUpdateVariables = {
  projectRef?: string
  protocol: string
  endpoint: string
  serviceApiKey: string

  userId: string
  // For now just support updating banning the user
  banDuration: number | 'none' // In hours,  "none" to unban, otherwise a string in hours e.g "24h"
}

export async function updateUser({
  protocol,
  endpoint,
  serviceApiKey,
  userId,
  banDuration,
}: UserUpdateVariables) {
  // [Joshen] This is probably the only endpoint that needs the put method from lib/common/fetch
  // as it's not our internal API.
  const response = await put(
    `${protocol}://${endpoint}/auth/v1/admin/users/${userId}`,
    { ban_duration: typeof banDuration === 'number' ? `${banDuration}h` : banDuration },
    {
      headers: {
        apikey: serviceApiKey,
        Authorization: `Bearer ${serviceApiKey}`,
      },
      credentials: undefined,
    }
  )

  if (response.error) throw response.error
  return response
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
  const userManagementV2 = useFlag('userManagementV2')

  return useMutation<UserUpdateData, ResponseError, UserUpdateVariables>(
    (vars) => updateUser(vars),
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
          toast.error(`Failed to update user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
