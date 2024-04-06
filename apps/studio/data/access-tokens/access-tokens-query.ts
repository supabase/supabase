import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { accessTokenKeys } from './keys'

export type AccessToken = {
  id: number
  token_alias: string
  name: string
  created_at: number
}

export type AccessTokensResponse = AccessToken[]

export async function getAccessTokens(signal?: AbortSignal) {
  const response = await get<AccessTokensResponse>(`${API_URL}/profile/access-tokens`, {
    signal,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

export type AccessTokensData = Awaited<ReturnType<typeof getAccessTokens>>
export type AccessTokensError = unknown

export const useAccessTokensQuery = <TData = AccessTokensData>({
  enabled = true,
  ...options
}: UseQueryOptions<AccessTokensData, AccessTokensError, TData> = {}) =>
  useQuery<AccessTokensData, AccessTokensError, TData>(
    accessTokenKeys.list(),
    ({ signal }) => getAccessTokens(signal),
    options
  )
