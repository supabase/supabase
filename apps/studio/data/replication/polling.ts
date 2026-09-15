import type { FetchStatus } from '@tanstack/react-query'

// Restart the interval after a response. Slow endpoints never accumulate overlapping polls.
export const replicationPollingOptions = {
  refetchInterval: (query: { state: { fetchStatus: FetchStatus } }) =>
    query.state.fetchStatus === 'fetching' ? false : 1_000,
  refetchIntervalInBackground: false,
  retry: false,
} as const
