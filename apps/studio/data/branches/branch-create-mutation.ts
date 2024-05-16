import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import { projectKeys } from 'data/projects/keys'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchCreateVariables = {
  projectRef: string
  branchName: string
  gitBranch?: string
  region?: string
}

export async function createBranch({
  projectRef,
  branchName,
  gitBranch,
  region,
}: BranchCreateVariables) {
  const { data, error } = await post('/v1/projects/{ref}/branches', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      branch_name: branchName,
      git_branch: gitBranch,
      region: region,
    },
  })

  if (error) handleError(error)
  return data
}

type BranchCreateData = Awaited<ReturnType<typeof createBranch>>

export const useBranchCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchCreateData, ResponseError, BranchCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchCreateData, ResponseError, BranchCreateVariables>(
    (vars) => createBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(projectRef))
        await queryClient.invalidateQueries(projectKeys.detail(projectRef))
        await queryClient.invalidateQueries(projectKeys.list())
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
