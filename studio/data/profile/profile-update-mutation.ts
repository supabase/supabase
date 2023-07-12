import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
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
  ...options
}: Omit<
  UseMutationOptions<ProfileUpdateData, unknown, ProfileUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProfileUpdateData, unknown, ProfileUpdateVariables>(
    (vars) => updateProfile(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(profileKeys.profile())

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
