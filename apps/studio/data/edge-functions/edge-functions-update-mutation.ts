import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
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

  const { data, error } = await patch(`/v1/projects/{ref}/functions/{function_slug}`, {
    params: {
      path: { ref: projectRef, function_slug: slug },
    },
    body: payload,
  })

  if (error) handleError(error)
  return data
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
        await Promise.all([
          queryClient.invalidateQueries(edgeFunctionsKeys.detail(projectRef, slug)),
          queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef)),
        ])
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
