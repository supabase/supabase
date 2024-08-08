import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type GithubBranchVariables = {
  connectionId: number
  branchName: string
}

export async function checkGithubBranchValidity(
  { connectionId, branchName }: GithubBranchVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(
    '/platform/integrations/github/branches/{connectionId}/{branchName}',
    {
      params: {
        path: {
          connectionId,
          branchName,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
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
