import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'
import type {
  RollbackResponse,
  RollbackResponseWithNewVersion,
} from 'components/interfaces/Functions/EdgeFunctionVersions/types'

export type EdgeFunctionRollbackVariables = {
  projectRef: string
  slug: string
  target_version: number
}

export async function rollbackEdgeFunction({
  slug,
  target_version,
}: EdgeFunctionRollbackVariables) {
  const response = await fetch(`/api/edge-functions/rollback?slug=${slug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_version }),
  })

  if (!response.ok) {
    throw new Error(`Failed to rollback: ${response.statusText}`)
  }

  const data = await response.json()
  return data as RollbackResponse | RollbackResponseWithNewVersion
}

export type EdgeFunctionRollbackData = RollbackResponse | RollbackResponseWithNewVersion
export type EdgeFunctionRollbackError = ResponseError

export const useEdgeFunctionRollbackMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    EdgeFunctionRollbackData,
    EdgeFunctionRollbackError,
    EdgeFunctionRollbackVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    EdgeFunctionRollbackData,
    EdgeFunctionRollbackError,
    EdgeFunctionRollbackVariables
  >((vars) => rollbackEdgeFunction(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef, slug } = variables

      // Invalidate deployments list to refetch latest state
      await queryClient.invalidateQueries(edgeFunctionsKeys.deployments(projectRef, slug))

      if ('active_version' in data) {
        toast.success(`Successfully rolled back to version ${data.active_version}`)
      } else {
        toast.success(
          `Successfully rolled back to version ${data.rolled_back_to} (new version ${data.version} created)`
        )
      }

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to rollback: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
