import { QueryClient } from '@tanstack/react-query'
import { createQuery } from 'react-query-kit'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrganizationVariables = { slug: string }
export type OrganizationDetail = components['schemas']['OrganizationSlugResponse']

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

export async function getOrganization(
  { slug }: OrganizationVariables,
  { signal }: { signal: AbortSignal }
) {
  const { data, error } = await get('/platform/organizations/{slug}', {
    params: { path: { slug } },
    signal,
  })
  if (error) handleError(error)
  return castOrganizationSlugResponseToOrganization(data)
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganization>>
export type OrganizationsError = ResponseError

export const useOrganizationQuery = createQuery<
  OrganizationsData,
  OrganizationVariables,
  OrganizationsError
>({
  queryKey: ['organizations'],
  fetcher: getOrganization,
  staleTime: 30 * 60 * 1000,
})

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries({ queryKey: useOrganizationQuery.getKey() })
}
