import type { QueryClient, QueryKey } from '@tanstack/react-query'

import { replicationKeys } from './keys'

const isPollingQuery = ({ queryKey }: { queryKey: QueryKey }) =>
  queryKey.at(-1) === 'status' || queryKey.at(-1) === 'replication-status'

export const invalidateReplicationPipelineQueries = (
  queryClient: QueryClient,
  projectRef: string | undefined
) => {
  const queryKey = replicationKeys.pipelines(projectRef)
  return Promise.all([
    queryClient.invalidateQueries({ queryKey, predicate: (query) => !isPollingQuery(query) }),
    // Polls will refresh again after the current read; metadata needs a post-mutation read now.
    queryClient.invalidateQueries(
      { queryKey, predicate: isPollingQuery },
      { cancelRefetch: false }
    ),
  ])
}
