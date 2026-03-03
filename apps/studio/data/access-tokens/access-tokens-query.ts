import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { accessTokenKeys } from './keys'

export async function getAccessTokens(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/access-tokens', { signal })

  if (error) handleError(error)

  return data
}

export type AccessTokensData = Awaited<ReturnType<typeof getAccessTokens>>
export type AccessTokensError = ResponseError

export type AccessToken = AccessTokensData[number]

export const useAccessTokensQuery = <TData = AccessTokensData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<AccessTokensData, AccessTokensError, TData> = {}) =>
  useQuery<AccessTokensData, AccessTokensError, TData>({
    queryKey: accessTokenKeys.list(),
    queryFn: ({ signal }) => getAccessTokens(signal),
    ...options,
  })
