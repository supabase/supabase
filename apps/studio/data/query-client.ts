import { QueryClient, onlineManager } from '@tanstack/react-query'
import { IS_PLATFORM } from 'lib/constants'
import { useState } from 'react'
import { ResponseError } from 'types'

// When running locally we don't need the internet
// so we can pretend we're online all the time
if (!IS_PLATFORM) {
  onlineManager.setOnline(true)
}

let queryClient: QueryClient | undefined

export function getQueryClient() {
  const _queryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry(failureCount, error) {
            // Don't retry on 4xx errors
            if (
              error instanceof ResponseError &&
              error.code !== undefined &&
              error.code >= 400 &&
              error.code < 500 &&
              // Still retry on 429s (rate limit)
              error.code !== 429
            ) {
              return false
            }

            if (failureCount < 3) {
              return true
            }

            return false
          },
          retryDelay(failureCount, error) {
            if (error instanceof ResponseError && error.retryAfter) {
              return error.retryAfter * 1000
            }

            // react-query default: doubles, starting at 1000ms, with each attempt, but will not exceed 30 seconds
            return Math.min(1000 * 2 ** failureCount, 30000)
          },
        },
      },
    })

  // For SSG and SSR always create a new queryClient
  if (typeof window === 'undefined') return _queryClient
  // Create the queryClient once in the client
  if (!queryClient) queryClient = _queryClient

  return queryClient
}

export function useRootQueryClient() {
  const [_queryClient] = useState(() => getQueryClient())

  return _queryClient
}
