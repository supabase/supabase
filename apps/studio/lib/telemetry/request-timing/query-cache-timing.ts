import type { Mutation, Query, QueryClient } from '@tanstack/react-query'

import { getQueryLabel } from './query-label.utils'
import type { RequestTimingCollector } from './request-timing-collector'

/**
 * Times React Query fetches and mutations and hands them to the collector.
 *
 * The cache callbacks (`onSuccess`, `onError`, `onSettled`) carry no start time, so this
 * subscribes to the caches' state changes instead: a `fetch`/`pending` action starts the
 * clock and `success`/`error` stops it.
 *
 * A query's duration covers everything React Query does for one fetch, including retries and
 * their backoff, and a fetch that is already in flight is shared rather than started again.
 * These are not network timings. Those come from the fetch layer and describe the same work,
 * so the two must not be added together.
 *
 * Returns a function that stops observing.
 */
export function observeQueryClient(
  queryClient: QueryClient,
  collector: RequestTimingCollector
): () => void {
  const queryStarts = new WeakMap<Query, { startMs: number; isBackgroundRefetch: boolean }>()
  const mutationStarts = new WeakMap<Mutation<any, any, any, any>, number>()

  const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'removed') {
      queryStarts.delete(event.query)
      return
    }
    if (event.type !== 'updated') return

    const { query, action } = event

    switch (action.type) {
      case 'fetch': {
        // Repeated when fetch options change mid-flight; the first start is the real one
        if (!collector.isRecording || queryStarts.has(query)) return
        queryStarts.set(query, {
          startMs: collector.now(),
          isBackgroundRefetch: query.state.data !== undefined,
        })
        return
      }

      case 'success':
      case 'error': {
        // `setQueryData` also dispatches success, with no fetch behind it
        if (action.type === 'success' && action.manual) return

        const start = queryStarts.get(query)
        if (!start) return
        queryStarts.delete(query)

        collector.recordQuery({
          label: getQueryLabel(query.queryKey),
          durationMs: collector.now() - start.startMs,
          isError: action.type === 'error',
          isBackgroundRefetch: start.isBackgroundRefetch,
        })
        return
      }

      case 'setState': {
        // A cancelled fetch is reverted this way and never reaches success or error
        queryStarts.delete(query)
        return
      }
    }
  })

  const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'removed') {
      mutationStarts.delete(event.mutation)
      return
    }
    if (event.type !== 'updated') return

    const { mutation, action } = event

    switch (action.type) {
      case 'pending': {
        // Dispatched again when `onMutate` returns a context; keep the first start
        if (!collector.isRecording || mutationStarts.has(mutation)) return
        mutationStarts.set(mutation, collector.now())
        return
      }

      case 'success':
      case 'error': {
        const startMs = mutationStarts.get(mutation)
        if (startMs === undefined) return
        mutationStarts.delete(mutation)

        collector.recordMutation({
          durationMs: collector.now() - startMs,
          isError: action.type === 'error',
        })
        return
      }
    }
  })

  return () => {
    unsubscribeQueries()
    unsubscribeMutations()
  }
}
