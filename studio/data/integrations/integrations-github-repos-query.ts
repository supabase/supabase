import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

export type GitHubReposVariables = {
  integrationId: string | undefined
}

export type GitHubReposResponse = {
  id: number
  full_name: string
}

export async function getGitHubRepos(
  { integrationId }: GitHubReposVariables,
  signal?: AbortSignal
) {
  if (!integrationId) {
    throw new Error('integrationId is required')
  }

  const response = await get(`${API_URL}/integrations/github/repos/${integrationId}`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as GitHubReposResponse[]
}

export type GitHubReposData = Awaited<ReturnType<typeof getGitHubRepos>>
export type GitHubReposError = unknown

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
