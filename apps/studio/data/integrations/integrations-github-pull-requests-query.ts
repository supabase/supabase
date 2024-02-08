import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { integrationKeys } from './keys'
import { ResponseError } from 'types'
import { components } from 'data/api'

export type GithubPullRequestsVariables = {
  organizationIntegrationId?: string
  repoOwner: string
  repoName: string
  prNumbers?: number[]
}

export type GitHubPullRequest = components['schemas']['GetGithubPullRequest']

export async function getGitHubPullRequests(
  { organizationIntegrationId, repoOwner, repoName, prNumbers }: GithubPullRequestsVariables,
  signal?: AbortSignal
) {
  if (!organizationIntegrationId) throw new Error('Organization integration ID is required')
  if (!prNumbers) throw new Error('A list of PR numbers is required')

  const { data, error } = await get(
    `/platform/integrations/github/pull-requests/{organization_integration_id}/{repo_owner}/{repo_name}`,
    {
      params: {
        path: {
          organization_integration_id: organizationIntegrationId,
          repo_owner: repoOwner,
          repo_name: repoName,
        },
        query: {
          // @ts-ignore generated api types is incorrect here, to remove ignore statement once fixed
          pr_number: prNumbers,
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
  { organizationIntegrationId, repoOwner, repoName, prNumbers }: GithubPullRequestsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GithubPullRequestsData, GithubPullRequestsError, TData> = {}
) =>
  useQuery<GithubPullRequestsData, GithubPullRequestsError, TData>(
    // [Joshen] Just fyi im not sure if we need to include prNumber in the RQ key here
    integrationKeys.githubPullRequestsList(organizationIntegrationId, repoOwner, repoName),
    ({ signal }) =>
      getGitHubPullRequests({ organizationIntegrationId, repoOwner, repoName, prNumbers }, signal),
    {
      enabled:
        enabled &&
        typeof organizationIntegrationId !== 'undefined' &&
        typeof repoOwner !== 'undefined' &&
        typeof repoName !== 'undefined' &&
        typeof prNumbers !== 'undefined',
      ...options,
    }
  )
