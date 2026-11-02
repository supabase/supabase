import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { BranchesData } from './branches-query'
import { branchKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { GrantForVariants } from '@/lib/grants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type BranchDeleteGrant = GrantForVariants<'delete', '/v1/branches/{branch_id_or_ref}'>

export type BranchDeleteVariables = {
  grant: BranchDeleteGrant
  branchRef: string
  projectRef: string
}

export async function deleteBranch({
  branchRef,
  grant,
}: Pick<BranchDeleteVariables, 'branchRef' | 'grant'>) {
  const { data, error } = await del('/v1/branches/{branch_id_or_ref}', {
    params: { path: { branch_id_or_ref: branchRef } },
    grant,
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
  UseCustomMutationOptions<BranchDeleteData, ResponseError, BranchDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchDeleteData, ResponseError, BranchDeleteVariables>({
    mutationFn: (vars) => deleteBranch(vars),
    async onSuccess(data, variables, context) {
      const { branchRef, projectRef } = variables
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: branchKeys.list(projectRef) })
      }, 5000)

      const branches: BranchesData | undefined = queryClient.getQueryData(
        branchKeys.list(projectRef)
      )
      if (branches) {
        const updatedBranches = branches.filter((branch) => branch.project_ref !== branchRef)
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
  })
}
