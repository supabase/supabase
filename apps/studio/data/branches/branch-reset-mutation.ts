import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchResetVariables = {
  id: string
  projectRef: string
}

export async function resetBranch({ id }: Pick<BranchResetVariables, 'id'>) {
  const { data, error } = await post('/v1/branches/{branch_id}/reset', {
    params: { path: { branch_id: id } },
  })

  if (error) handleError(error)
  return data
}

type BranchResetData = Awaited<ReturnType<typeof resetBranch>>

export const useBranchResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchResetData, ResponseError, BranchResetVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchResetData, ResponseError, BranchResetVariables>(
    (vars) => resetBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to reset branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
