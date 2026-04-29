import { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'

let queryClient: QueryClient | undefined

function getQueryClient() {
  const _queryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: (failureCount, error) => {
            // Don't retry on 404s
            if (
              typeof error === 'object' &&
              error !== null &&
              'code' in error &&
              error.code === 404
            ) {
              return false
            }

            if (failureCount < 3) {
              return true
            }

            return false
          },
        },
      },
    })

  // For SSG and SSR always create a new queryClient
  if (typeof window === 'undefined') return _queryClient

  // Create the query client once in the client
  if (!queryClient) queryClient = _queryClient
  return queryClient
}

export function useRootQueryClient() {
  const [_queryClient] = useState(() => getQueryClient())

  return _queryClient
}
