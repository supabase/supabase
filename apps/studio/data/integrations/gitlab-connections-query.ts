import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type GitLabConnectionsVariables = {
  organizationId?: number
}

export async function getGitLabConnections(
  { organizationId }: GitLabConnectionsVariables,
  signal?: AbortSignal
) {
  if (!organizationId) throw new Error('organizationId is required')

  const { data, error } = await get('/platform/integrations/gitlab/connections', {
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

export type GitLabConnectionsData = Awaited<ReturnType<typeof getGitLabConnections>>
export type GitLabConnectionsError = ResponseError

export type GitLabConnection = GitLabConnectionsData[0]

export const useGitLabConnectionsQuery = <TData = GitLabConnectionsData>(
  { organizationId }: GitLabConnectionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GitLabConnectionsData, GitLabConnectionsError, TData> = {}
) => {
  return useQuery<GitLabConnectionsData, GitLabConnectionsError, TData>(
    integrationKeys.gitlabConnectionsList(organizationId),
    ({ signal }) => getGitLabConnections({ organizationId }, signal),
    { enabled: enabled && typeof organizationId !== 'undefined', ...options }
  )
}
