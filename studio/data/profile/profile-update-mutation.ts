import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { profileKeys } from './keys'

export type ProfileUpdateVariables = {
  firstName: string
  lastName: string
}

export async function updateProfile({ firstName, lastName }: ProfileUpdateVariables) {
  const response = await patch(`${API_URL}/profile`, {
    first_name: firstName,
    last_name: lastName,
  })
  if (response.error) {
    throw response.error
  }

  return response
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
