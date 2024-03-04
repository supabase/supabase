import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

// FIXME(kamil): Do not retry, a single check is fine.
export async function getGitHubAuthorization(signal?: AbortSignal) {
  const { data, error } = await get('/platform/integrations/github/authorization', {
    signal,
  })
  return error ? null : data
}

export type GitHubAuthorizationData = Awaited<ReturnType<typeof getGitHubAuthorization>>
export type ProjectGitHubRepositoryConnectionsData = Awaited<
  ReturnType<typeof getGitHubAuthorization>
>
export type GitHubAuthorizationError = ResponseError

export const useGitHubAuthorizationQuery = <TData = GitHubAuthorizationData>({
  enabled = true,
  ...options
}: UseQueryOptions<GitHubAuthorizationData, GitHubAuthorizationError, TData> = {}) => {
  return useQuery<GitHubAuthorizationData, GitHubAuthorizationError, TData>(
    integrationKeys.githubAuthorization(),
    ({ signal }) => getGitHubAuthorization(signal),
    { enabled, staleTime: 0, ...options }
  )
}
