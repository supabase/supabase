import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { apiKeysKeys } from './keys'

export type APIKeyUpdateVariables = {
  projectRef: string
  apiKeyId: string
  description: string | null
}

export async function updateAPIKey(payload: APIKeyUpdateVariables) {
  const { data, error } = await post('/v1/projects/{ref}/api-keys/{apiKeyId}', {
    params: { path: { ref: payload.projectRef, apiKeyId: payload.apiKeyId } },
    body: {
      description: payload.description?.trim() || null,
    },
  })

  if (error) handleError(error)
  return data
}

type APIKeyUpdateData = Awaited<ReturnType<typeof updateAPIKey>>

export const useUpdateAPIKeyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<APIKeyUpdateData, ResponseError, APIKeyUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<APIKeyUpdateData, ResponseError, APIKeyUpdateVariables>(
    (vars) => updateAPIKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(apiKeysKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
