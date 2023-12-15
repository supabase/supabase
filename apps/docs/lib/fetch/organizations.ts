import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from './fetchWrappers'
import { ResponseError } from '~/types/fetch'

const organizationKeys = {
  list: () => ['organizations'] as const,
}

async function getOrganizations(signal?: AbortSignal) {
  const { data, error } = await get('/platform/organizations', { signal })
  if (error) throw error
  return data
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

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries({ queryKey: organizationKeys.list() })
}
