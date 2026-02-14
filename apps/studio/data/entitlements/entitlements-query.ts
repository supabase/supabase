import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { organizationKeys } from 'data/organizations/keys'
import { UseCustomQueryOptions } from 'types'
import { ResponseError } from 'types/base'

export type FeatureKey =
  components['schemas']['ListEntitlementsResponse']['entitlements'][number]['feature']['key']

export type EntitlementsVariables = {
  slug: string
}

export type EntitlementConfig =
  components['schemas']['ListEntitlementsResponse']['entitlements'][0]['config']
export type Entitlement = components['schemas']['ListEntitlementsResponse']['entitlements'][0]
export type EntitlementType = Entitlement['type']

export async function getEntitlements({ slug }: EntitlementsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/entitlements', {
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
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EntitlementsData, EntitlementsError, TData> = {}
) => {
  return useQuery<EntitlementsData, EntitlementsError, TData>({
    queryKey: [organizationKeys.entitlements(slug)],
    queryFn: ({ signal }) => getEntitlements({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
    staleTime: 30 * 60 * 1000,
  })
}
