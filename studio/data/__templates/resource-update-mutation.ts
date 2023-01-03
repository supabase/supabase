import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
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
  ...options
}: Omit<
  UseMutationOptions<ResourceUpdateData, unknown, ResourceUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ResourceUpdateData, unknown, ResourceUpdateVariables>(
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
      ...options,
    }
  )
}
