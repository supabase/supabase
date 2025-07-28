import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { BranchesData } from './branches-query'
import { branchKeys } from './keys'

export type BranchDeleteVariables = {
  id: string
  projectRef: string
}

export async function deleteBranch({ id }: Pick<BranchDeleteVariables, 'id'>) {
  const { data, error } = await del('/v1/branches/{branch_id}', {
    params: { path: { branch_id: id } },
  })

  if (error) handleError(error)
  return data
}

type BranchDeleteData = Awaited<ReturnType<typeof deleteBranch>>

export const useBranchDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchDeleteData, ResponseError, BranchDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchDeleteData, ResponseError, BranchDeleteVariables>(
    (vars) => deleteBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        setTimeout(() => {
          queryClient.invalidateQueries(branchKeys.list(projectRef))
        }, 5000)

        const branches: BranchesData | undefined = queryClient.getQueryData(
          branchKeys.list(projectRef)
        )
        if (branches) {
          const updatedBranches = branches.filter((branch) => branch.id !== variables.id)
          queryClient.setQueryData(branchKeys.list(projectRef), updatedBranches)
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
