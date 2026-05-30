import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppSigningKeyDeleteVariables = {
  slug: string
  appId: string
  keyId: string
}

export async function deletePlatformAppSigningKey({
  slug,
  appId,
  keyId,
}: PlatformAppSigningKeyDeleteVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/apps/{app_id}/signing-keys/{key_id}',
    {
      params: { path: { slug, app_id: appId, key_id: keyId } },
    }
  )

  if (error) handleError(error)
  return data
}

export type PlatformAppSigningKeyDeleteData = Awaited<
  ReturnType<typeof deletePlatformAppSigningKey>
>

export const usePlatformAppSigningKeyDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PlatformAppSigningKeyDeleteData,
    ResponseError,
    PlatformAppSigningKeyDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PlatformAppSigningKeyDeleteData,
    ResponseError,
    PlatformAppSigningKeyDeleteVariables
  >({
    mutationFn: (vars) => deletePlatformAppSigningKey(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformAppKeys.signingKeys(variables.slug, variables.appId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete signing key: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
