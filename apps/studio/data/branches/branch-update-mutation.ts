import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchUpdateVariables = {
  branchRef: string
  projectRef: string
  branchName?: string
  gitBranch?: string
  persistent?: boolean
  requestReview?: boolean
}

export async function updateBranch({
  branchRef,
  branchName,
  gitBranch,
  persistent,
  requestReview,
}: BranchUpdateVariables) {
  const { data, error } = await patch('/v1/branches/{branch_id_or_ref}', {
    params: {
      path: { branch_id_or_ref: branchRef },
    },
    body: {
      branch_name: branchName,
      git_branch: gitBranch,
      persistent,
      request_review: requestReview,
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
