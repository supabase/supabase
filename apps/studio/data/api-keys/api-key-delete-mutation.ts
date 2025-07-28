import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { del, handleError } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { apiKeysKeys } from './keys'

export type APIKeyDeleteVariables = {
  projectRef?: string
  id: string
}

export async function deleteAPIKey(payload: APIKeyDeleteVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/v1/projects/{ref}/api-keys/{id}', {
    params: {
      path: { ref: payload.projectRef, id: payload.id },
      query: { reveal: false },
    },
  })

  if (error) handleError(error)
  return data
}

type APIKeyDeleteData = Awaited<ReturnType<typeof deleteAPIKey>>

export const useAPIKeyDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<APIKeyDeleteData, ResponseError, APIKeyDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<APIKeyDeleteData, ResponseError, APIKeyDeleteVariables>(
    (vars) => deleteAPIKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(apiKeysKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete API key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
