import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsUpdateVariables = {
  projectRef: string
  slug: string
  payload: {
    name?: string
    verify_jwt?: boolean
    import_map?: boolean
  }
}

export async function updateEdgeFunction({
  projectRef,
  slug,
  payload,
}: EdgeFunctionsUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await patch(`${API_ADMIN_URL}/projects/${projectRef}/functions/${slug}`, payload)
  if (response.error) throw response.error

  return response
}

type EdgeFunctionsUpdateData = Awaited<ReturnType<typeof updateEdgeFunction>>

export const useEdgeFunctionUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionsUpdateData, unknown, EdgeFunctionsUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsUpdateData, unknown, EdgeFunctionsUpdateVariables>(
    (vars) => updateEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, slug } = variables
        await queryClient.invalidateQueries(edgeFunctionsKeys.detail(projectRef, slug))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
