import { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'

let queryClient: QueryClient | undefined

export function getQueryClient() {
  const _queryClient = queryClient ?? new QueryClient()

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
