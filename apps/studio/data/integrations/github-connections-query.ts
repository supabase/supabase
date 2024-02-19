import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'
import { useIntegrationsQuery } from './integrations-query'

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
  if (error) throw new Error((error as ResponseError).message)
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
  const { data: integrations } = useIntegrationsQuery()
  const hasGithubIntegration =
    integrations?.some((int) => int.integration.name === 'GitHub') ?? false

  return useQuery<GitHubConnectionsData, GitHubConnectionsError, TData>(
    integrationKeys.githubConnectionsList(organizationId),
    ({ signal }) => getGitHubConnections({ organizationId }, signal),
    { enabled: hasGithubIntegration, ...options }
  )
}
