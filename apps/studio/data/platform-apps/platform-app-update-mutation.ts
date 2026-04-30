import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { handleError, patch } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppUpdateVariables = {
  slug: string
  appId: string
} & components['schemas']['UpdatePlatformAppBody']

export async function updatePlatformApp({ slug, appId, ...body }: PlatformAppUpdateVariables) {
  const { data, error } = await patch('/platform/organizations/{slug}/apps/{app_id}', {
    params: { path: { slug, app_id: appId } },
    body,
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppUpdateData = Awaited<ReturnType<typeof updatePlatformApp>>

export const usePlatformAppUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<PlatformAppUpdateData, ResponseError, PlatformAppUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<PlatformAppUpdateData, ResponseError, PlatformAppUpdateVariables>({
    mutationFn: (vars) => updatePlatformApp(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformAppKeys.list(variables.slug) }),
        queryClient.invalidateQueries({
          queryKey: platformAppKeys.detail(variables.slug, variables.appId),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
