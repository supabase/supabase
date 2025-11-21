import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { integrationKeys } from './keys'

export async function getGitHubRepositories(signal?: AbortSignal) {
  const { data, error } = await get('/platform/integrations/github/repositories', {
    signal,
  })

  if (error) handleError(error)
  return data
}

export type GitHubRepositoriesData = Awaited<ReturnType<typeof getGitHubRepositories>>
export type ProjectGitHubRepositoryConnectionsData = Awaited<
  ReturnType<typeof getGitHubRepositories>
>
export type GitHubRepositoriesError = ResponseError

export const useGitHubRepositoriesQuery = <TData = GitHubRepositoriesData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<GitHubRepositoriesData, GitHubRepositoriesError, TData> = {}) => {
  return useQuery<GitHubRepositoriesData, GitHubRepositoriesError, TData>({
    queryKey: integrationKeys.githubRepositoriesList(),
    queryFn: ({ signal }) => getGitHubRepositories(signal),
    enabled,
    staleTime: 0,
    ...options,
  })
}
