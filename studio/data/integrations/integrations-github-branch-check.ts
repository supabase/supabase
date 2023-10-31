import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'

export type GithubBranchVariables = {
  organizationIntegrationId?: string
  repoOwner: string
  repoName: string
  branchName: string
}

export async function checkGithubBranchValidity(
  { organizationIntegrationId, repoOwner, repoName, branchName }: GithubBranchVariables,
  signal?: AbortSignal
) {
  if (!organizationIntegrationId) throw new Error('Organization integration ID is required')

  const { data, error } = await get(
    '/platform/integrations/github/branches/{organization_integration_id}/{repo_owner}/{repo_name}/{branch_name}',
    {
      params: {
        path: {
          organization_integration_id: organizationIntegrationId,
          repo_owner: repoOwner,
          repo_name: repoName,
          branch_name: branchName,
        },
      },
      signal,
    }
  )

  if (error) throw error
  return data
}

type GitHubIntegrationCreateData = Awaited<ReturnType<typeof checkGithubBranchValidity>>

export const useCheckGithubBranchValidity = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<GitHubIntegrationCreateData, ResponseError, GithubBranchVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<GitHubIntegrationCreateData, ResponseError, GithubBranchVariables>(
    (vars) => checkGithubBranchValidity(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to check Github branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
