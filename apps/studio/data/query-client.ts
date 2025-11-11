import { QueryClient, onlineManager } from '@tanstack/react-query'
import { match } from 'path-to-regexp'
import { useState } from 'react'

import { IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'

// When running locally we don't need the internet
// so we can pretend we're online all the time
if (!IS_PLATFORM) {
  onlineManager.setOnline(true)
}

const SKIP_RETRY_PATHNAME_MATCHERS = [
  '/platform/projects/:ref/run-lints',
  '/platform/organizations/:slug/usage',
  '/platform/pg-meta/:ref/query',
  '/v1/projects/:ref/analytics/endpoints/logs.all',
].map((pathname) => match(pathname))

export const MAX_RETRY_FAILURE_COUNT = 3

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

            // Skip retries for specific pathnames to avoid unnecessary load
            // CRITICAL: We must still retry 429 (rate limit) errors even on these pathnames.
            // Without this exception, queries fail immediately on rate limits, causing the
            // frontend to issue fresh requests (via refetch/user actions), which amplifies
            // the rate limiting problem. By retrying 429s with proper backoff (using the
            // retryAfter header below), we respect rate limits and prevent request storms.
            if (
              error instanceof ResponseError &&
              error.requestPathname &&
              SKIP_RETRY_PATHNAME_MATCHERS.some((matchFn) => matchFn(error.requestPathname!)) &&
              error.code !== 429
            ) {
              return false
            }

            if (failureCount < MAX_RETRY_FAILURE_COUNT) {
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
