import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchMergeVariables = {
  id: string
  projectRef: string
  migration_version?: string
}

export async function mergeBranch({
  id,
  migration_version,
}: Pick<BranchMergeVariables, 'id' | 'migration_version'>) {
  const { data, error } = await post('/v1/branches/{branch_id}/merge', {
    params: { path: { branch_id: id } },
    body: {
      migration_version,
    },
  })

  if (error) handleError(error)
  return data
}

type BranchMergeData = Awaited<ReturnType<typeof mergeBranch>>

export const useBranchMergeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchMergeData, ResponseError, BranchMergeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchMergeData, ResponseError, BranchMergeVariables>(
    (vars) => mergeBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          // Backend currently returns "push" errors for merge operations due to internal routing
          let errorMessage = data.message || 'Unknown error occurred'

          // Replace "push" with "merge" in error messages since we're doing a merge operation
          if (errorMessage.includes('failed to push branch')) {
            errorMessage = errorMessage.replace('failed to push branch', 'failed to merge branch')
          }

          toast.error(`Failed to merge branch: ${errorMessage}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
