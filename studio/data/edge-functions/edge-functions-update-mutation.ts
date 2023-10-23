import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { ResponseError } from 'types'
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
  onError,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionsUpdateData, ResponseError, EdgeFunctionsUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsUpdateData, ResponseError, EdgeFunctionsUpdateVariables>(
    (vars) => updateEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, slug } = variables
        await queryClient.invalidateQueries(edgeFunctionsKeys.detail(projectRef, slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update edge function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
