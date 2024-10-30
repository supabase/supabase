import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchUpdateVariables = {
  id: string
  projectRef: string
  branchName?: string
  gitBranch?: string
  persistent?: boolean
}

export async function updateBranch({
  id,
  branchName,
  gitBranch,
  persistent,
}: BranchUpdateVariables) {
  const { data, error } = await patch('/v1/branches/{branch_id}', {
    params: {
      path: { branch_id: id },
    },
    body: {
      branch_name: branchName,
      git_branch: gitBranch,
      persistent,
    },
  })

  if (error) handleError(error)
  return data
}

type BranchUpdateData = Awaited<ReturnType<typeof updateBranch>>

export const useBranchUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchUpdateData, ResponseError, BranchUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchUpdateData, ResponseError, BranchUpdateVariables>(
    (vars) => updateBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
