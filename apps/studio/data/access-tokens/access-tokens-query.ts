import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { accessTokenKeys } from './keys'

export async function getAccessTokens(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/access-tokens', { signal })

  if (error) handleError(error)

  return data
}

export type AccessTokensData = Awaited<ReturnType<typeof getAccessTokens>>
export type AccessTokensError = unknown

export type AccessToken = AccessTokensData[number]

export const useAccessTokensQuery = <TData = AccessTokensData>({
  enabled = true,
  ...options
}: UseQueryOptions<AccessTokensData, AccessTokensError, TData> = {}) =>
  useQuery<AccessTokensData, AccessTokensError, TData>(
    accessTokenKeys.list(),
    ({ signal }) => getAccessTokens(signal),
    options
  )
