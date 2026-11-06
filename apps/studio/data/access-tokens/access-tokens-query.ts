import { useQuery } from '@tanstack/react-query'

import { accessTokenKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export async function getAccessTokens(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/access-tokens', { signal })

  if (error) handleError(error)

  return data
}

export type AccessTokensData = Awaited<ReturnType<typeof getAccessTokens>>
export type AccessTokensError = StudioError

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
