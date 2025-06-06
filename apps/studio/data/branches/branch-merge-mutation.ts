import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'
import { getBranchDiff } from './branch-diff-query'

export type BranchMergeVariables = {
  id: string
  branchProjectRef: string
  baseProjectRef: string
  migration_version?: string
}

export async function mergeBranch({
  id,
  branchProjectRef,
  baseProjectRef,
  migration_version,
}: BranchMergeVariables) {
  // Step 1: Get the diff output from GET /v1/branches/id/diff
  const diffContent = await getBranchDiff({ branchId: id })

  let migrationCreated = false

  if (diffContent && diffContent.trim() !== '') {
    // Step 2: Send the whole diff to POST /v1/projects/<branch-project-ref>/database/migrations
    // to record it as a migration on the dev branch
    const { data: migrationData, error: migrationError } = await put(
      '/v1/projects/{ref}/database/migrations',
      {
        params: { path: { ref: branchProjectRef } },
        body: {
          query: diffContent,
        },
      }
    )

    if (migrationError) {
      handleError(migrationError)
    }

    migrationCreated = true
  }

  // Step 3: Call POST /v1/branches/id/merge to merge the branch
  const { data, error } = await post('/v1/branches/{branch_id}/merge', {
    params: { path: { branch_id: id } },
    body: { migration_version },
  })

  if (error) {
    handleError(error)
  }

  return {
    data,
    migrationCreated,
    hadChanges: diffContent && diffContent.trim() !== '',
    workflowRunId: data?.workflow_run_id,
  }
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
        const { baseProjectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(baseProjectRef))
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
