import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'
import { getBranchDiff } from './branch-diff-query'
import { getMigrations } from '../database/migrations-query'
import { pushBranch } from './branch-push-mutation'

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
  // Step 1: Check for conflicts - get migrations from both main and current branch
  let hasConflicts = false

  try {
    const [mainBranchMigrations, currentBranchMigrations] = await Promise.all([
      getMigrations({ projectRef: baseProjectRef }),
      getMigrations({ projectRef: branchProjectRef }),
    ])

    // Find the latest migration version on the current branch
    const latestCurrentMigration = currentBranchMigrations[0] // Migrations are ordered by version desc
    const latestCurrentVersion = latestCurrentMigration?.version

    // Check if there are newer migrations on main branch
    hasConflicts = mainBranchMigrations.some(
      (migration) => !latestCurrentVersion || migration.version > latestCurrentVersion
    )

    // Step 2: If there are conflicts, push the current branch to sync with main
    if (hasConflicts) {
      await pushBranch({ id })
    }
  } catch (error) {
    // If migration check fails, proceed without conflict resolution
    // This ensures the merge can still proceed if there are migration query issues
    console.warn('Migration conflict check failed, proceeding without resolution:', error)
    hasConflicts = false
  }

  // Step 3: Get the fresh diff output from GET /v1/branches/id/diff (after potential push)
  const diffContent = await getBranchDiff({ branchId: id })

  let migrationCreated = false

  // Step 4: If there are changes, create a migration on the branch
  if (diffContent && diffContent.trim() !== '') {
    // Generate a descriptive migration name based on current timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const migrationName = `branch_merge_${timestamp}`

    const { data: migrationData, error: migrationError } = await put(
      '/v1/projects/{ref}/database/migrations',
      {
        params: { path: { ref: branchProjectRef } },
        body: {
          query: diffContent,
          name: migrationName,
        },
      }
    )

    if (migrationError) {
      handleError(migrationError)
    }

    migrationCreated = true
  }

  // Step 5: Call POST /v1/branches/id/merge to merge the branch
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
    hadConflicts: hasConflicts,
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
          let errorMessage = data.message || 'Unknown error occurred'

          toast.error(`Failed to merge branch: ${errorMessage}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
