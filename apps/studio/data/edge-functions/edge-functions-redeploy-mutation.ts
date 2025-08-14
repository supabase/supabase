import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsRedeployVariables = {
  projectRef: string
  functionSlug: string
}

export async function redeployEdgeFunction({
  projectRef,
  functionSlug,
}: EdgeFunctionsRedeployVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!functionSlug) throw new Error('functionSlug is required')

  const { data, error } = await post('/api/edge-functions/redeploy', {
    body: {
      projectRef,
      functionSlug,
    },
  })

  if (error) handleError(error)
  return data
}

type EdgeFunctionsRedeployData = Awaited<ReturnType<typeof redeployEdgeFunction>>

export const useEdgeFunctionRedeployMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionsRedeployData, ResponseError, EdgeFunctionsRedeployVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EdgeFunctionsRedeployData, ResponseError, EdgeFunctionsRedeployVariables>(
    (vars) => redeployEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, functionSlug } = variables
        
        // Invalidate Edge Functions cache to reflect the redeployment
        await Promise.all([
          queryClient.invalidateQueries(edgeFunctionsKeys.detail(projectRef, functionSlug)),
          queryClient.invalidateQueries(edgeFunctionsKeys.body(projectRef, functionSlug)),
          queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef)),
        ])
        
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to redeploy edge function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
} 