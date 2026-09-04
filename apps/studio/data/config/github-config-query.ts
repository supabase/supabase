import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'

import { get, handleError } from '@/data/fetchers'
import type { UseCustomQueryOptions } from '@/types'

export type GitHubConfigVariables = {
  connectionId?: number
  branch?: string
}

type GithubConfigQueryResponse = components['schemas']['GetGitHubConnectionConfigResponse']

export const githubConfigKeys = {
  all: ['github-config'] as const,
  connection: (connectionId?: number, branch?: string) =>
    [...githubConfigKeys.all, connectionId, branch] as const,
}

export async function getGitHubConfig(
  { connectionId, branch }: GitHubConfigVariables,
  signal?: AbortSignal
) {
  if (!connectionId) throw new Error('connectionId is required')

  const { data, error } = await get(
    '/platform/integrations/github/connections/{connection_id}/config',
    {
      params: {
        path: { connection_id: connectionId },
        query: { ref: branch },
      },
      signal,
    }
  )

  if (error) return handleError(error)
  return data
}

export const useGitHubConfigQuery = <TData = GithubConfigQueryResponse>(
  variables: GitHubConfigVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<GithubConfigQueryResponse, Error, TData> = {}
) =>
  useQuery<GithubConfigQueryResponse, Error, TData>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: githubConfigKeys.connection(variables.connectionId, variables.branch),
    queryFn: ({ signal }) => getGitHubConfig(variables, signal),
    enabled: enabled && typeof variables.connectionId !== 'undefined',
    staleTime: 30_000,
    ...options,
  })
