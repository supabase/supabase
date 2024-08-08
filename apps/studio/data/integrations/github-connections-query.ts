import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type GitHubConnectionsVariables = {
  organizationId?: number
}

export async function getGitHubConnections(
  { organizationId }: GitHubConnectionsVariables,
  signal?: AbortSignal
) {
  if (!organizationId) throw new Error('organizationId is required')

  const { data, error } = await get('/platform/integrations/github/connections', {
    params: {
      query: {
        organization_id: organizationId,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data.connections
}

export type GitHubConnectionsData = Awaited<ReturnType<typeof getGitHubConnections>>
export type GitHubConnectionsError = ResponseError

export type GitHubConnection = GitHubConnectionsData[0]

export const useGitHubConnectionsQuery = <TData = GitHubConnectionsData>(
  { organizationId }: GitHubConnectionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GitHubConnectionsData, GitHubConnectionsError, TData> = {}
) => {
  return useQuery<GitHubConnectionsData, GitHubConnectionsError, TData>(
    integrationKeys.githubConnectionsList(organizationId),
    ({ signal }) => getGitHubConnections({ organizationId }, signal),
    { enabled: enabled && typeof organizationId !== 'undefined', ...options }
  )
}
