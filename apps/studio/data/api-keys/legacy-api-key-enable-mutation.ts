import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { put, handleError } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { legacyAPIKeysEnabledKeys } from './keys'

export type UpdateLegacyAPIKeysEnabledVariables = {
  projectRef?: string
  enabled: boolean
}

export async function updateLegacyAPIKeysEnabled(payload: UpdateLegacyAPIKeysEnabledVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await put('/v1/projects/{ref}/api-keys/legacy', {
    params: {
      path: { ref: payload.projectRef },
      query: { enabled: payload.enabled },
    },
  })

  if (error) handleError(error)
  return data
}

type UpdateLegacyAPIKeysEnabledData = Awaited<ReturnType<typeof updateLegacyAPIKeysEnabled>>

export const useUpdateLegacyAPIKeysEnabledMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    UpdateLegacyAPIKeysEnabledData,
    ResponseError,
    UpdateLegacyAPIKeysEnabledVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateLegacyAPIKeysEnabledData,
    ResponseError,
    UpdateLegacyAPIKeysEnabledVariables
  >((vars) => updateLegacyAPIKeysEnabled(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries(legacyAPIKeysEnabledKeys.enabled(projectRef))

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to ${variables.enabled ? 're-enable' : 'disable'} JWT-based API keys: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
