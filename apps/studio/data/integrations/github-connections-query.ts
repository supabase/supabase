import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { integrationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

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
  }: UseCustomQueryOptions<GitHubConnectionsData, GitHubConnectionsError, TData> = {}
) => {
  return useQuery<GitHubConnectionsData, GitHubConnectionsError, TData>({
    queryKey: integrationKeys.githubConnectionsList(organizationId),
    queryFn: ({ signal }) => getGitHubConnections({ organizationId }, signal),
    enabled: enabled && typeof organizationId !== 'undefined',
    staleTime: 30 * 60 * 1000,
    ...options,
  })
}

export const useProjectGitHubConnectionQuery = ({ ref }: { ref?: string }) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: connections, ...props } = useGitHubConnectionsQuery(
    { organizationId: organization?.id },
    { enabled: !!ref && !!organization?.id }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === ref),
    [connections, ref]
  )
  return { data: existingConnection, ...props }
}
