import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types/base'

export type EntitlementsVariables = {
  slug: string
}

export async function getEntitlements( { slug }: EntitlementsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/v1/organizations/{slug}/entitlements', {
    params: { path: { slug } },
    signal,
  })
  if (error) handleError(error)

  return data
}

export type EntitlementsData = Awaited<ReturnType<typeof getEntitlements>>
export type EntitlementsError = ResponseError

export const useEntitlementsQuery = <TData = EntitlementsData>(
    { slug }: EntitlementsVariables,
    { enabled = true, ...options }: UseQueryOptions<EntitlementsData, EntitlementsError, TData> = {}
) => {
    return useQuery<EntitlementsData, EntitlementsError, TData>(
        ['entitlements', slug],
        ({ signal }) => getEntitlements({ slug }, signal),
        { enabled: enabled && typeof slug !== 'undefined', ...options, staleTime: 1 * 60 * 1000 }
    )
}