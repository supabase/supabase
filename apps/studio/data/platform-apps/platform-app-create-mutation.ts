import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppCreateVariables = {
  slug: string
} & components['schemas']['CreatePlatformAppBody']

export async function createPlatformApp({ slug, ...body }: PlatformAppCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/apps', {
    params: { path: { slug } },
    body,
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppCreateData = Awaited<ReturnType<typeof createPlatformApp>>

export const usePlatformAppCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<PlatformAppCreateData, ResponseError, PlatformAppCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<PlatformAppCreateData, ResponseError, PlatformAppCreateVariables>({
    mutationFn: (vars) => createPlatformApp(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: platformAppKeys.list(variables.slug) })
      // Seed the detail cache so ViewAppSheet can show permissions without a separate GET call
      if (data?.id) {
        queryClient.setQueryData(platformAppKeys.detail(variables.slug, data.id), data)
      }
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
