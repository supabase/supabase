import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsDeleteVariables = {
  projectRef: string
  slug: string
}

export async function deleteEdgeFunction({ projectRef, slug }: EdgeFunctionsDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await delete_(`${API_ADMIN_URL}/projects/${projectRef}/functions/${slug}`, {})
  if (response.error) {
    throw response.error
  }

  return response
}

type EdgeFunctionsDeleteData = Awaited<ReturnType<typeof deleteEdgeFunction>>

export const useEdgeFunctionDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionsDeleteData, unknown, EdgeFunctionsDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsDeleteData, unknown, EdgeFunctionsDeleteVariables>(
    (vars) => deleteEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef), {
          refetchType: 'all',
        })
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
