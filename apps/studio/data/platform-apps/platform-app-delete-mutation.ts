import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppDeleteVariables = {
  slug: string
  appId: string
}

export async function deletePlatformApp({ slug, appId }: PlatformAppDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/apps/{app_id}', {
    params: { path: { slug, app_id: appId } },
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppDeleteData = Awaited<ReturnType<typeof deletePlatformApp>>

export const usePlatformAppDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<PlatformAppDeleteData, ResponseError, PlatformAppDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<PlatformAppDeleteData, ResponseError, PlatformAppDeleteVariables>({
    mutationFn: (vars) => deletePlatformApp(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: platformAppKeys.list(variables.slug) })
      await queryClient.invalidateQueries({
        queryKey: platformAppKeys.installations(variables.slug),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
