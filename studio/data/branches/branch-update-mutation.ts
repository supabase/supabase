import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchUpdateVariables = {
  id: string
  projectRef: string
  branchName?: string
  gitBranch?: string
}

export async function updateBranch({ id, branchName, gitBranch }: BranchUpdateVariables) {
  const { data, error } = await patch('/v1/branches/{branch_id}', {
    params: {
      path: { branch_id: id },
    },
    body: {
      branch_name: branchName,
      git_branch: gitBranch,
    },
  })

  if (error) throw error
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
