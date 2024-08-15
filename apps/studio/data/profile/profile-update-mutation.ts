import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { profileKeys } from './keys'

export type ProfileUpdateVariables = {
  firstName: string
  lastName: string
}

export async function updateProfile({ firstName, lastName }: ProfileUpdateVariables) {
  const { data, error } = await patch('/platform/profile', {
    body: { first_name: firstName, last_name: lastName },
  })

  if (error) handleError(error)
  return data
}

type ProfileUpdateData = Awaited<ReturnType<typeof updateProfile>>

export const useProfileUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProfileUpdateData, ResponseError, ProfileUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProfileUpdateData, ResponseError, ProfileUpdateVariables>(
    (vars) => updateProfile(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(profileKeys.profile())
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create profile: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
