import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

// [Joshen] Maybe this should be within useSelectedOrganization hook
export type OrganizationVariables = { slug?: string }
export type OrganizationDetail = components['schemas']['OrganizationSlugResponse']

export async function getOrganization({ slug }: OrganizationVariables, signal?: AbortSignal) {
  // @ts-expect-error [Joshen Oriole] API typing issue?
  const { data, error } = await get('/platform/organizations/{slug}', {
    params: { path: { slug } },
    signal,
  })
  if (error) handleError(error)
  return data as OrganizationDetail
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganization>>
export type OrganizationsError = ResponseError

export const useOrganizationQuery = <TData = OrganizationsData>(
  { slug }: OrganizationVariables,
  { enabled = true, ...options }: UseQueryOptions<OrganizationsData, OrganizationsError, TData> = {}
) => {
  return useQuery<OrganizationsData, OrganizationsError, TData>(
    organizationKeys.detail(slug),
    ({ signal }) => getOrganization({ slug }, signal),
    { enabled: enabled, ...options, staleTime: 30 * 60 * 1000 }
  )
}

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries(organizationKeys.list())
}
