import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsDeleteVariables = {
  projectRef: string
  slug: string
}

export async function deleteEdgeFunction({ projectRef, slug }: EdgeFunctionsDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del(`/v1/projects/{ref}/functions/{function_slug}`, {
    params: {
      path: { ref: projectRef, function_slug: slug },
    },
  })

  if (error) handleError(error)
  return data
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
