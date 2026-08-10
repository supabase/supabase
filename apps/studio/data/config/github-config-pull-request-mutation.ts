import { useMutation } from '@tanstack/react-query'

import { constructHeaders } from '@/data/fetchers'
import type {
  GitHubConfigErrorResponse,
  GitHubConfigPullRequestRequest,
  GitHubConfigPullRequestResponse,
} from '@/lib/github-config.types'
import type { UseCustomMutationOptions } from '@/types'

export async function requestGitHubConfigPullRequest(
  request: GitHubConfigPullRequestRequest
): Promise<GitHubConfigPullRequestResponse> {
  const headers = await constructHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  })
  const response = await fetch('/api/github-config', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(request),
  })
  const body = (await response.json()) as
    | GitHubConfigPullRequestResponse
    | GitHubConfigErrorResponse

  if (!response.ok) {
    throw new Error(
      'error' in body ? body.error.message : `GitHub pull request failed (${response.status})`
    )
  }
  return body as GitHubConfigPullRequestResponse
}

export const useGitHubConfigPullRequestMutation = (
  options: Omit<
    UseCustomMutationOptions<
      GitHubConfigPullRequestResponse,
      Error,
      GitHubConfigPullRequestRequest
    >,
    'mutationFn'
  > = {}
) =>
  useMutation<GitHubConfigPullRequestResponse, Error, GitHubConfigPullRequestRequest>({
    mutationFn: requestGitHubConfigPullRequest,
    ...options,
  })
