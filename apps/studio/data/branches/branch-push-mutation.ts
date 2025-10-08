import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchPushVariables = {
  branchRef: string
  projectRef: string
}

export async function pushBranch({ branchRef }: Pick<BranchPushVariables, 'branchRef'>) {
  const { data, error } = await post('/v1/branches/{branch_id_or_ref}/push', {
    params: { path: { branch_id_or_ref: branchRef } },
    body: {},
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
  UseMutationOptions<BranchPushData, ResponseError, BranchPushVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchPushData, ResponseError, BranchPushVariables>(
    (vars) => pushBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(projectRef))
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
    }
  )
}
