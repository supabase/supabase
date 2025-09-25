import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchCreateVariables = {
  projectRef: string
  branchName: string
  gitBranch?: string
  region?: string
  withData?: boolean
} & Pick<components['schemas']['CreateBranchBody'], 'is_default' | 'desired_instance_size'>

export async function createBranch({
  projectRef,
  is_default,
  branchName,
  gitBranch,
  region,
  withData,
  desired_instance_size,
}: BranchCreateVariables) {
  const { data, error } = await post('/v1/projects/{ref}/branches', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      is_default,
      branch_name: branchName,
      git_branch: gitBranch,
      region,
      with_data: withData,
      desired_instance_size,
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
