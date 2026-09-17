import type { FetchStatus } from '@tanstack/react-query'

import type { ResponseError } from '@/types'

// Restart the interval after a response. Slow endpoints never accumulate overlapping polls.
export const replicationPollingOptions = {
  refetchInterval: ({
    state,
  }: {
    state: { fetchStatus: FetchStatus; error: ResponseError | null }
  }) => {
    if (state.fetchStatus === 'fetching') return false
    const retryAfter = state.error?.retryAfter
    if (retryAfter && retryAfter > 0) return Math.max(1_000, retryAfter * 1_000)
    if (state.error?.code && state.error.code >= 400) return 30_000
    return 5_000
  },
  refetchIntervalInBackground: false,
  retry: false,
} as const
