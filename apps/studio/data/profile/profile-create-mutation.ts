import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { organizationKeys } from 'data/organizations/keys'
import { permissionKeys } from 'data/permissions/keys'
import type { ResponseError } from 'types'
import { profileKeys } from './keys'

export type ProfileResponse = components['schemas']['ProfileResponse']

export async function createProfile() {
  const { data, error } = await post('/platform/profile')

  if (error) handleError(error)
  return data
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
