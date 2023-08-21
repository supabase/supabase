import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { resourceKeys } from './keys'

export type ResourceUpdateVariables = {
  projectRef: string
  id: string
  updatedParam: string
}

export async function updateResource({ projectRef, id, updatedParam }: ResourceUpdateVariables) {
  const response = await patch(`${API_URL}/projects/${projectRef}/resources/${id}`, {
    updated_param: updatedParam,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type ResourceUpdateData = Awaited<ReturnType<typeof updateResource>>

export const useResourceUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ResourceUpdateData, ResponseError, ResourceUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ResourceUpdateData, ResponseError, ResourceUpdateVariables>(
    (vars) => updateResource(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, id } = variables

        await Promise.all([
          queryClient.invalidateQueries(resourceKeys.list(projectRef)),
          queryClient.invalidateQueries(resourceKeys.resource(projectRef, id)),
        ])

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
