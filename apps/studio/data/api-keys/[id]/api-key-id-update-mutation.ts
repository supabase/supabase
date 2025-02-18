import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { handleError, patch } from 'data/fetchers'
import { toast } from 'sonner'
import { ResponseError } from 'types'
import { apiKeysKeys } from '../keys'

export interface UpdateAPIKeybyIdVariables {
  projectRef?: string
  id?: string
  description?: string
}

export async function updateAPIKeysById(
  { projectRef, id, description }: UpdateAPIKeybyIdVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('API key ID is required')

  const { data, error } = await patch('/v1/projects/{ref}/api-keys/{id}', {
    params: {
      path: { ref: projectRef, id },
      query: { reveal: false },
    },
    body: {
      description: description,
    },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type ResourceUpdateData = Awaited<ReturnType<typeof updateAPIKeysById>>

export const useResourceUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ResourceUpdateData, ResponseError, UpdateAPIKeybyIdVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ResourceUpdateData, ResponseError, UpdateAPIKeybyIdVariables>(
    (vars) => updateAPIKeysById(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, id } = variables

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
