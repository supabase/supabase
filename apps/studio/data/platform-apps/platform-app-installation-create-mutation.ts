import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppInstallationCreateVariables = {
  slug: string
} & components['schemas']['InstallPlatformAppBody']

export async function createPlatformAppInstallation({
  slug,
  ...body
}: PlatformAppInstallationCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/apps/installations', {
    params: { path: { slug } },
    body,
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppInstallationCreateData = Awaited<
  ReturnType<typeof createPlatformAppInstallation>
>

export const usePlatformAppInstallationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PlatformAppInstallationCreateData,
    ResponseError,
    PlatformAppInstallationCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PlatformAppInstallationCreateData,
    ResponseError,
    PlatformAppInstallationCreateVariables
  >({
    mutationFn: (vars) => createPlatformAppInstallation(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformAppKeys.installations(variables.slug),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to install app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
