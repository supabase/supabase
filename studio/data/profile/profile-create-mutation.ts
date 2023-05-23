import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { profileKeys } from './keys'
import { Profile } from './types'

export type ProfileResponse = Profile

export async function createProfile() {
  const response = await post(`${API_URL}/profile`, {})
  if (response.error) {
    throw response.error
  }

  return response as ProfileResponse
}

type ProfileCreateData = Awaited<ReturnType<typeof createProfile>>

export const useProfileCreateMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<ProfileCreateData, unknown, void>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProfileCreateData, unknown, void>(() => createProfile(), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(profileKeys.profile())

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
