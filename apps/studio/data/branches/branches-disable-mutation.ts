import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import { projectKeys } from 'data/projects/keys'
import type { ResponseError } from 'types'
import { deleteBranch } from './branch-delete-mutation'
import { branchKeys } from './keys'

export type BranchesDisableVariables = {
  branchIds: string[]
  projectRef: string
}

export async function disableBranching({ branchIds, projectRef }: BranchesDisableVariables) {
  // Delete all preview branches first
  if (branchIds.length > 0) {
    const res = await Promise.all(
      branchIds.map(async (id) => {
        try {
          return await deleteBranch({ id })
        } catch (error) {
          return error
        }
      })
    )
    const hasError = res.some((item: any) => item.message !== 'ok')
    if (hasError) throw new Error('Failed to disable branching: Unable to delete all branches')
  }

  // Then disable branching
  const { data, error } = await del('/v1/projects/{ref}/branches', {
    params: { path: { ref: projectRef } },
  })
  if (error) handleError(error)
  return data
}

type BranchesDisableData = Awaited<ReturnType<typeof disableBranching>>

export const useBranchesDisableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchesDisableData, ResponseError, BranchesDisableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchesDisableData, ResponseError, BranchesDisableVariables>(
    (vars) => disableBranching(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(projectRef))
        await queryClient.invalidateQueries(projectKeys.detail(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to disable branching: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
