import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { keys } from './keys'

export type DeleteThirdPartyAuthIntegrationVariables = {
  projectRef: string
  tpaId: string
}

export async function deleteThirdPartyIntegration({
  projectRef,
  tpaId,
}: DeleteThirdPartyAuthIntegrationVariables) {
  const { data, error } = await del('/v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}', {
    params: {
      path: {
        ref: projectRef,
        tpa_id: tpaId,
      },
    },
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
  UseMutationOptions<
    DeleteThirdPartyAuthIntegrationData,
    ResponseError,
    DeleteThirdPartyAuthIntegrationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    DeleteThirdPartyAuthIntegrationData,
    ResponseError,
    DeleteThirdPartyAuthIntegrationVariables
  >((vars) => deleteThirdPartyIntegration(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(keys.integrations(projectRef))
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
