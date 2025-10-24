import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { scopedAccessTokenKeys } from './keys'

export async function getScopedAccessTokens(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/scoped-access-tokens', { signal })

  if (error) handleError(error)

  return data
}

export async function getScopedAccessToken({ id }: { id: string }, signal?: AbortSignal) {
  if (!id) throw new Error('Token ID is required')

  const { data, error } = await get('/platform/profile/scoped-access-tokens/{id}', {
    params: { path: { id } },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type ScopedAccessTokensData = Awaited<ReturnType<typeof getScopedAccessTokens>>
export type ScopedAccessTokensError = ResponseError

export type ScopedAccessToken =
  components['schemas']['GetScopedAccessTokensResponse']['tokens'][number]

export type ScopedAccessTokenData = Awaited<ReturnType<typeof getScopedAccessToken>>

export const useScopedAccessTokensQuery = <TData = ScopedAccessTokensData>({
  enabled = true,
  ...options
}: UseQueryOptions<ScopedAccessTokensData, ScopedAccessTokensError, TData> = {}) =>
  useQuery<ScopedAccessTokensData, ScopedAccessTokensError, TData>(
    scopedAccessTokenKeys.list(),
    ({ signal }) => getScopedAccessTokens(signal),
    options
  )

export const useScopedAccessTokenQuery = <TData = ScopedAccessTokenData>(
  { id }: { id: string },
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ScopedAccessTokenData, ScopedAccessTokensError, TData> = {}
) =>
  useQuery<ScopedAccessTokenData, ScopedAccessTokensError, TData>(
    scopedAccessTokenKeys.detail(id),
    ({ signal }) => getScopedAccessToken({ id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
