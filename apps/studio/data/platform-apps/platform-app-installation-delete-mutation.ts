import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { platformAppKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PlatformAppInstallationDeleteVariables = {
  slug: string
  installationId: string
}

export async function deletePlatformAppInstallation({
  slug,
  installationId,
}: PlatformAppInstallationDeleteVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/apps/installations/{installation_id}',
    { params: { path: { slug, installation_id: installationId } } }
  )

  if (error) handleError(error)
  return data
}

export type PlatformAppInstallationDeleteData = Awaited<
  ReturnType<typeof deletePlatformAppInstallation>
>

export const usePlatformAppInstallationDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PlatformAppInstallationDeleteData,
    ResponseError,
    PlatformAppInstallationDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PlatformAppInstallationDeleteData,
    ResponseError,
    PlatformAppInstallationDeleteVariables
  >({
    mutationFn: (vars) => deletePlatformAppInstallation(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: platformAppKeys.installations(variables.slug),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to uninstall app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
