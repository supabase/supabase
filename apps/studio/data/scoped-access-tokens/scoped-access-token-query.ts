import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { scopedAccessTokenKeys } from './keys'

export async function getAccessTokens(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/scoped-access-tokens', { signal })

  if (error) handleError(error)

    console.log(data)

  return data
}

export type ScopedAccessTokensData = Awaited<ReturnType<typeof getAccessTokens>>
export type ScopedAccessTokensError = ResponseError

export type ScopedAccessToken = components['schemas']['GetScopedAccessTokensResponse']['tokens'][number]

export const useScopedAccessTokensQuery = <TData = ScopedAccessTokensData>({
  enabled = true,
  ...options
}: UseQueryOptions<ScopedAccessTokensData, ScopedAccessTokensError, TData> = {}) =>
  useQuery<ScopedAccessTokensData, ScopedAccessTokensError, TData>(
    scopedAccessTokenKeys.list(),
    ({ signal }) => getAccessTokens(signal),
    options
  )
