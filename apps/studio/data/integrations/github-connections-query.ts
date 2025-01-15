import { createQuery } from 'react-query-kit'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type GitHubConnectionsVariables = {
  organizationId: number
}

export async function getGitHubConnections(
  { organizationId }: GitHubConnectionsVariables,
  { signal }: { signal: AbortSignal }
) {
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

export const useGitHubConnectionsQuery = createQuery<
  GitHubConnectionsData,
  GitHubConnectionsVariables,
  GitHubConnectionsError
>({
  queryKey: ['organizations', 'github-connections'],
  fetcher: getGitHubConnections,
})
