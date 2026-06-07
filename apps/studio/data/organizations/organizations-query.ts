import { QueryClient, useQuery } from '@tanstack/react-query'
import { platformComponents as components } from 'api-types'

import { organizationKeys } from './keys'
import { getManagedByFromOrganizationPartner } from './managed-by-utils'
import { get, handleError } from '@/data/fetchers'
import { useProfile } from '@/lib/profile'
import type { Organization, ResponseError, UseCustomQueryOptions } from '@/types'

export type OrganizationBase = components['schemas']['OrganizationResponse']

export function castOrganizationResponseToOrganization(org: OrganizationBase): Organization {
  return {
    ...org,
    billing_email: org.billing_email ?? 'Unknown',
    managed_by: getManagedByFromOrganizationPartner(org.billing_partner, org.integration_source),
    partner_id: org.slug.startsWith('vercel_') ? org.slug.replace('vercel_', '') : undefined,
  }
}

export async function getOrganizations({
  signal,
  headers,
}: {
  signal?: AbortSignal
  headers?: Record<string, string>
}): Promise<Organization[]> {
  const { data, error } = await get('/platform/organizations', { signal, headers })

  if (error) handleError(error)
  if (!Array.isArray(data)) return []

  return data
    .map(castOrganizationResponseToOrganization)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganizations>>
export type OrganizationsError = ResponseError

export const useOrganizationsQuery = <TData = OrganizationsData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<OrganizationsData, OrganizationsError, TData> = {}) => {
  const { profile } = useProfile()
  return useQuery<OrganizationsData, OrganizationsError, TData>({
    queryKey: organizationKeys.list(),
    queryFn: ({ signal }) => getOrganizations({ signal }),
    enabled: enabled && profile !== undefined,
    ...options,
    staleTime: 30 * 60 * 1000,
  })
}

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries({ queryKey: organizationKeys.list() })
}
