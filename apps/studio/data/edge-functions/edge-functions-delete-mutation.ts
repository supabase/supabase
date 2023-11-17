import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { ResponseError } from 'types'
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
  onError,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionsDeleteData, ResponseError, EdgeFunctionsDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsDeleteData, ResponseError, EdgeFunctionsDeleteVariables>(
    (vars) => deleteEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef), {
          refetchType: 'all',
        })
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete edge function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
