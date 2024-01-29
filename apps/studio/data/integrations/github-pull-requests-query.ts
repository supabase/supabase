import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { integrationKeys } from './keys'
import { ResponseError } from 'types'
import { components } from 'data/api'

export type GitHubPullRequestsVariables = {
  connectionId?: number
  prNumbers?: number[]
}

// TODO(alaister): find the actual type
export type GitHubPullRequest = any

export async function getGitHubPullRequests(
  { connectionId, prNumbers = [] }: GitHubPullRequestsVariables,
  signal?: AbortSignal
) {
  if (!connectionId) throw new Error('connectionId is required')

  const { data, error } = await get(`/platform/integrations/github/pull-requests/{connectionId}`, {
    params: {
      path: {
        connectionId,
      },
      query: {
        pr_number: prNumbers,
      },
    },
    signal,
  })

  if (error) throw error
  return data
}

export type GitHubPullRequestsData = Awaited<ReturnType<typeof getGitHubPullRequests>>
export type GitHubPullRequestsError = ResponseError

export const useGitHubPullRequestsQuery = <TData = GitHubPullRequestsData>(
  { connectionId, prNumbers }: GitHubPullRequestsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GitHubPullRequestsData, GitHubPullRequestsError, TData> = {}
) =>
  useQuery<GitHubPullRequestsData, GitHubPullRequestsError, TData>(
    integrationKeys.githubPullRequestsList(connectionId, prNumbers),
    ({ signal }) => getGitHubPullRequests({ connectionId, prNumbers }, signal),
    {
      enabled: enabled && typeof connectionId !== 'undefined',
      ...options,
    }
  )
