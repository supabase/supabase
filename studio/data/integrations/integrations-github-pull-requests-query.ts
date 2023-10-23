import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { integrationKeys } from './keys'
import { ResponseError } from 'types'
import { components } from 'data/api'

export type GithubPullRequestsVariables = {
  organizationIntegrationId?: string
  repoOwner: string
  repoName: string
  target?: string
}

export type GitHubPullRequest = components['schemas']['GetGithubPullRequest']

export async function getGitHubPullRequests(
  { organizationIntegrationId, repoOwner, repoName, target }: GithubPullRequestsVariables,
  signal?: AbortSignal
) {
  if (!organizationIntegrationId) throw new Error('Organization integration ID is required')
  if (!target) throw new Error('Target branch is required')

  const { data, error } = await get(
    `/platform/integrations/github/pull-requests/{organization_integration_id}/{repo_owner}/{repo_name}/{target}`,
    {
      params: {
        path: {
          organization_integration_id: organizationIntegrationId,
          repo_owner: repoOwner,
          repo_name: repoName,
          target,
        },
      },
      signal,
    }
  )

  if (error) throw error
  return data
}

export type GithubPullRequestsData = Awaited<ReturnType<typeof getGitHubPullRequests>>
export type GithubPullRequestsError = ResponseError

export const useGithubPullRequestsQuery = <TData = GithubPullRequestsData>(
  { organizationIntegrationId, repoOwner, repoName, target }: GithubPullRequestsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GithubPullRequestsData, GithubPullRequestsError, TData> = {}
) =>
  useQuery<GithubPullRequestsData, GithubPullRequestsError, TData>(
    integrationKeys.githubPullRequestsList(organizationIntegrationId, repoOwner, repoName, target),
    ({ signal }) =>
      getGitHubPullRequests({ organizationIntegrationId, repoOwner, repoName, target }, signal),
    {
      enabled:
        enabled &&
        typeof organizationIntegrationId !== 'undefined' &&
        typeof repoOwner !== 'undefined' &&
        typeof repoName !== 'undefined' &&
        typeof target !== 'undefined',
      ...options,
    }
  )
