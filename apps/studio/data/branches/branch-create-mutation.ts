import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchCreateVariables = {
  is_default?: boolean
  projectRef: string
  branchName: string
  gitBranch?: string
  region?: string
  withData?: boolean
}

export async function createBranch({
  is_default,
  projectRef,
  branchName,
  gitBranch,
  region,
  withData,
}: BranchCreateVariables) {
  const { data, error } = await post('/v1/projects/{ref}/branches', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      is_default,
      branch_name: branchName,
      git_branch: gitBranch,
      region: region,
      with_data: withData,
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
