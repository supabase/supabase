import { useCallback } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'

import { authKeys } from './keys'
import { auth, getAccessToken } from 'lib/gotrue'

export async function getSessionAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') return ''

  try {
    return await getAccessToken()
  } catch (e: any) {
    // ignore the error
    return null
  }
}

export type SessionAccessTokenData = Awaited<ReturnType<typeof getSessionAccessToken>>
export type SessionAccessTokenError = unknown

export const useSessionAccessTokenQuery = <TData = SessionAccessTokenData>({
  enabled = true,
  ...options
}: UseQueryOptions<SessionAccessTokenData, SessionAccessTokenError, TData> = {}) =>
  useQuery<SessionAccessTokenData, SessionAccessTokenError, TData>(
    authKeys.accessToken(),
    () => getSessionAccessToken(),
    options
  )

export const useSessionAccessTokenPrefetch = () => {
  const client = useQueryClient()
  return useCallback(
    () => client.prefetchQuery(authKeys.accessToken(), () => getSessionAccessToken()),
    []
  )
}
