import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export async function getGitLabRepositories(signal?: AbortSignal) {
  const { data, error } = await get('/platform/integrations/gitlab/repositories', {
    signal,
  })

  if (error) handleError(error)
  // [Alaister]: temp fix until we have a proper response type
  return (data as any).repositories
}

export type GitLabRepositoriesData = Awaited<ReturnType<typeof getGitLabRepositories>>
export type ProjectGitLabRepositoryConnectionsData = Awaited<
  ReturnType<typeof getGitLabRepositories>
>
export type GitLabRepositoriesError = ResponseError

export const useGitLabRepositoriesQuery = <TData = GitLabRepositoriesData>({
  enabled = true,
  ...options
}: UseQueryOptions<GitLabRepositoriesData, GitLabRepositoriesError, TData> = {}) => {
  return useQuery<GitLabRepositoriesData, GitLabRepositoriesError, TData>(
    integrationKeys.gitlabRepositoriesList(),
    ({ signal }) => getGitLabRepositories(signal),
    { enabled, staleTime: 0, ...options }
  )
}
