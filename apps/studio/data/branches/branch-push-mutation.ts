import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { actionKeys } from '../actions/keys'
import { branchKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { GrantForVariants } from '@/lib/grants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type BranchPushGrant = GrantForVariants<'post', '/v1/branches/{branch_id_or_ref}/push'>

export type BranchPushVariables = {
  grant: BranchPushGrant
  branchRef: string
  projectRef: string
}

export async function pushBranch({
  branchRef,
  grant,
}: Pick<BranchPushVariables, 'branchRef' | 'grant'>) {
  const { data, error } = await post('/v1/branches/{branch_id_or_ref}/push', {
    params: { path: { branch_id_or_ref: branchRef } },
    body: {},
    grant,
  })

  if (error) handleError(error)
  return data
}

type BranchPushData = Awaited<ReturnType<typeof pushBranch>>

export const useBranchPushMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<BranchPushData, ResponseError, BranchPushVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchPushData, ResponseError, BranchPushVariables>({
    mutationFn: (vars) => pushBranch(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: branchKeys.list(projectRef) })
      await queryClient.invalidateQueries({ queryKey: actionKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to push branch: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
