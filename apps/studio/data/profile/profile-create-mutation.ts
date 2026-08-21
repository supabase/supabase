import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { profileKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import { organizationKeys } from '@/data/organizations/keys'
import { permissionKeys } from '@/data/permissions/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

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
}: Omit<UseCustomMutationOptions<ProfileCreateData, ResponseError, void>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProfileCreateData, ResponseError, void>({
    mutationFn: () => createProfile(),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.profile() }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.list() }),
        queryClient.invalidateQueries({ queryKey: permissionKeys.list() }),
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
