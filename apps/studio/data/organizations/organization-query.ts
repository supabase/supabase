import { QueryClient, useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { organizationKeys } from './keys'

export type OrganizationVariables = { slug?: string }
export type OrganizationDetail = components['schemas']['OrganizationSlugResponse']
export type OrganizationPlanID = OrganizationDetail['plan']['id']

function castOrganizationSlugResponseToOrganization(
  org: components['schemas']['OrganizationSlugResponse']
) {
  return {
    ...org,
    billing_email: org.billing_email ?? 'Unknown',
    managed_by: org.slug.startsWith('vercel_icfg_') ? 'vercel-marketplace' : 'supabase',
    partner_id: org.slug.startsWith('vercel_') ? org.slug.replace('vercel_', '') : undefined,
  }
}

export async function getOrganization({ slug }: OrganizationVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}', {
    params: { path: { slug } },
    signal,
  })
  if (error) handleError(error)
  return castOrganizationSlugResponseToOrganization(data)
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganization>>
export type OrganizationsError = ResponseError

export const useOrganizationQuery = <TData = OrganizationsData>(
  { slug }: OrganizationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationsData, OrganizationsError, TData> = {}
) => {
  return useQuery<OrganizationsData, OrganizationsError, TData>({
    queryKey: organizationKeys.detail(slug),
    queryFn: ({ signal }) => getOrganization({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
    staleTime: 30 * 60 * 1000,
  })
}

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries({ queryKey: organizationKeys.list() })
}
