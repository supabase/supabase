import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { branchKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type BranchRestoreVariables = {
  branchRef: string
  projectRef: string
}

export async function restoreBranch({ branchRef }: BranchRestoreVariables) {
  const { data, error } = await post('/v1/branches/{branch_id_or_ref}/restore', {
    params: {
      path: { branch_id_or_ref: branchRef },
    },
  })

  if (error) handleError(error)
  return data
}

type BranchRestoreData = Awaited<ReturnType<typeof restoreBranch>>

export const useBranchRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchRestoreData, ResponseError, BranchRestoreVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchRestoreData, ResponseError, BranchRestoreVariables>({
    mutationFn: (vars) => restoreBranch(vars),
    async onSuccess(data, variables, context, mutationContext) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: branchKeys.list(projectRef) })
      await onSuccess?.(data, variables, context, mutationContext)
    },
    async onError(data, variables, context, mutationContext) {
      if (onError === undefined) {
        toast.error(`Failed to restore branch: ${data.message}`)
      } else {
        onError(data, variables, context, mutationContext)
      }
    },
    ...options,
  })
}
