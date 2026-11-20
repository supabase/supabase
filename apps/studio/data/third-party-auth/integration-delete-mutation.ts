import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { keys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'
import type { UseCustomMutationOptions } from '@/types'

export type DeleteThirdPartyAuthIntegrationGrant = GrantFor<
  'delete',
  '/v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}'
>

export type DeleteThirdPartyAuthIntegrationVariables = {
  projectRef: string
  grant: DeleteThirdPartyAuthIntegrationGrant
  tpaId: string
}

export async function deleteThirdPartyIntegration({
  projectRef,
  grant,
  tpaId,
}: DeleteThirdPartyAuthIntegrationVariables) {
  const { data, error } = await del('/v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}', {
    params: {
      path: {
        ref: projectRef,
        tpa_id: tpaId,
      },
    },
    grant,
  })
  if (error) handleError(error)
  return data
}

type DeleteThirdPartyAuthIntegrationData = Awaited<ReturnType<typeof deleteThirdPartyIntegration>>

export const useDeleteThirdPartyAuthIntegrationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DeleteThirdPartyAuthIntegrationData,
    StudioError,
    DeleteThirdPartyAuthIntegrationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    DeleteThirdPartyAuthIntegrationData,
    StudioError,
    DeleteThirdPartyAuthIntegrationVariables
  >({
    mutationFn: (vars) => deleteThirdPartyIntegration(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: keys.integrations(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete third party auth integration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
