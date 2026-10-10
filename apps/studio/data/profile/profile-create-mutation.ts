import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { profileKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import { organizationKeys } from '@/data/organizations/keys'
import { permissionKeys } from '@/data/permissions/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ProfileResponse = components['schemas']['ProfileResponse_Output']

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
    // Retry transient failures (5xx, network, 429), but never 4xx - a 409 means the profile
    // already exists, so retrying the POST can't help
    retry: (failureCount, error) => {
      const isClientError = error.code !== undefined && error.code >= 400 && error.code < 500
      if (isClientError && error.code !== 429) return false
      return failureCount < 3
    },
    retryDelay: (failureCount, error) => {
      if (error.code === 429 && error.retryAfter) return error.retryAfter * 1000
      return Math.min(1000 * 2 ** failureCount, 8000)
    },
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
