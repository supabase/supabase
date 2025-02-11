import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

// FIXME(kamil): Do not retry, a single check is fine.
export async function getGitLabAuthorization(signal?: AbortSignal) {
  const { data, error } = await get('/platform/integrations/gitlab/authorization', {
    signal,
  })
  return error ? null : data
}

export type GitLabAuthorizationData = Awaited<ReturnType<typeof getGitLabAuthorization>>
export type ProjectGitLabRepositoryConnectionsData = Awaited<
  ReturnType<typeof getGitLabAuthorization>
>
export type GitLabAuthorizationError = ResponseError

export const useGitLabAuthorizationQuery = <TData = GitLabAuthorizationData>({
  enabled = true,
  ...options
}: UseQueryOptions<GitLabAuthorizationData, GitLabAuthorizationError, TData> = {}) => {
  return useQuery<GitLabAuthorizationData, GitLabAuthorizationError, TData>(
    integrationKeys.gitlabAuthorization(),
    ({ signal }) => getGitLabAuthorization(signal),
    { enabled, staleTime: 0, ...options }
  )
}
