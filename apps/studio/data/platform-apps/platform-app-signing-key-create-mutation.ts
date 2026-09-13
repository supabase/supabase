import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppSigningKeyCreateVariables = {
  slug: string
  appId: string
}

export async function createPlatformAppSigningKey({
  slug,
  appId,
}: PlatformAppSigningKeyCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/apps/{app_id}/signing-keys', {
    params: { path: { slug, app_id: appId } },
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppSigningKeyCreateData = Awaited<
  ReturnType<typeof createPlatformAppSigningKey>
>

export const usePlatformAppSigningKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PlatformAppSigningKeyCreateData,
    ResponseError,
    PlatformAppSigningKeyCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PlatformAppSigningKeyCreateData,
    ResponseError,
    PlatformAppSigningKeyCreateVariables
  >({
    mutationFn: (vars) => createPlatformAppSigningKey(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformAppKeys.signingKeys(variables.slug, variables.appId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create signing key: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
