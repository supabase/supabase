import { useQuery } from '@tanstack/react-query'

import { getAccessToken } from 'common'
import { authKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

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
}: UseCustomQueryOptions<SessionAccessTokenData, SessionAccessTokenError, TData> = {}) =>
  useQuery<SessionAccessTokenData, SessionAccessTokenError, TData>({
    queryKey: authKeys.accessToken(),
    queryFn: () => getSessionAccessToken(),
    ...options,
  })
