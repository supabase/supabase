import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { upsertMigration } from '../database/migration-upsert-mutation'
import { getBranchDiff } from './branch-diff-query'
import { branchKeys } from './keys'

export type BranchMergeVariables = {
  branchProjectRef: string
  baseProjectRef: string
  migration_version?: string
  pgdelta?: boolean
}

export async function mergeBranch({
  branchProjectRef,
  migration_version,
  pgdelta,
}: BranchMergeVariables) {
  // Step 1: Get the diff output from the branch
  const diffContent = await getBranchDiff({ branchRef: branchProjectRef, pgdelta })

  let migrationCreated = false

  // Step 2: If there are changes, create a migration before merging
  if (diffContent && diffContent.trim() !== '') {
    // Generate a descriptive migration name based on current timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const migrationName = `branch_merge_${timestamp}`

    await upsertMigration({
      projectRef: branchProjectRef,
      query: diffContent,
      name: migrationName,
    })

    migrationCreated = true
  }

  // Step 3: Call POST /v1/branches/id/merge to merge the branch
  const { data, error } = await post('/v1/branches/{branch_id_or_ref}/merge', {
    params: { path: { branch_id_or_ref: branchProjectRef } },
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
  UseCustomMutationOptions<BranchMergeData, ResponseError, BranchMergeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchMergeData, ResponseError, BranchMergeVariables>({
    mutationFn: (vars) => mergeBranch(vars),
    async onSuccess(data, variables, context) {
      const { baseProjectRef } = variables
      await queryClient.invalidateQueries({ queryKey: branchKeys.list(baseProjectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        let errorMessage = data.message || 'Unknown error occurred'

        toast.error(`Failed to merge branch: ${errorMessage}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
