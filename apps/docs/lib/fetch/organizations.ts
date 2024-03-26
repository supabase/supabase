import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from './fetchWrappers'
import type { components } from '~/types/api'
import type { ResponseError } from '~/types/fetch'

const organizationKeys = {
  list: () => ['organizations'] as const,
}

async function getOrganizations(signal?: AbortSignal) {
  // The generated api response in api.d.ts is typed as OrganizationResponseV1
  // but the actual response should be typed as OrganizationResponse.
  const { data, error } = await get('/platform/organizations', { signal })
  if (error) throw error
  return data as unknown as components['schemas']['OrganizationResponse'][]
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganizations>>
type OrganizationsError = ResponseError

export function useOrganizationsQuery<TData = OrganizationsData>({
  enabled = true,
  ...options
}: Omit<UseQueryOptions<OrganizationsData, OrganizationsError, TData>, 'queryKey'> = {}) {
  return useQuery<OrganizationsData, OrganizationsError, TData>({
    queryKey: organizationKeys.list(),
    queryFn: ({ signal }) => getOrganizations(signal),
    enabled,
    ...options,
  })
}
