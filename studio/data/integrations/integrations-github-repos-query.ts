import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type GitHubReposVariables = {
  integrationId: string | undefined
}

export async function getGitHubRepos(
  { integrationId }: GitHubReposVariables,
  signal?: AbortSignal
) {
  if (!integrationId) {
    throw new Error('integrationId is required')
  }

  const { data, error } = await get(
    '/platform/integrations/github/repos/{organization_integration_id}',
    {
      params: {
        path: {
          organization_integration_id: integrationId,
        },
      },
      signal,
    }
  )
  if (error) {
    throw error
  }

  return data
}

export type GitHubReposData = Awaited<ReturnType<typeof getGitHubRepos>>
export type GitHubReposError = ResponseError

export const useGitHubReposQuery = <TData = GitHubReposData>(
  { integrationId }: GitHubReposVariables,
  { enabled = true, ...options }: UseQueryOptions<GitHubReposData, GitHubReposError, TData> = {}
) =>
  useQuery<GitHubReposData, GitHubReposError, TData>(
    integrationKeys.githubRepoList(integrationId),
    ({ signal }) => getGitHubRepos({ integrationId }, signal),
    {
      enabled: enabled && typeof integrationId !== 'undefined',
      ...options,
    }
  )
