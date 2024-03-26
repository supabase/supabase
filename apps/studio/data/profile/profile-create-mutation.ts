import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { organizationKeys } from 'data/organizations/keys'
import { permissionKeys } from 'data/permissions/keys'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { profileKeys } from './keys'
import type { Profile } from './types'

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
  onError,
  ...options
}: Omit<UseMutationOptions<ProfileCreateData, ResponseError, void>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProfileCreateData, ResponseError, void>(() => createProfile(), {
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries(profileKeys.profile()),
        queryClient.invalidateQueries(organizationKeys.list()),
        queryClient.invalidateQueries(permissionKeys.list()),
      ])
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
  })
}
