import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { handleError, put } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { apiKeysKeys } from './keys'

export type ToggleLegacyAPIKeysVariables = {
  projectRef?: string
  enabled: boolean
}

export async function toggleLegacyAPIKeys(payload: ToggleLegacyAPIKeysVariables) {
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

type ToggleLegacyAPIKeysData = Awaited<ReturnType<typeof toggleLegacyAPIKeys>>

export const useToggleLegacyAPIKeysMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ToggleLegacyAPIKeysData, ResponseError, ToggleLegacyAPIKeysVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ToggleLegacyAPIKeysData, ResponseError, ToggleLegacyAPIKeysVariables>(
    (vars) => toggleLegacyAPIKeys(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(apiKeysKeys.status(projectRef))

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
    }
  )
}
