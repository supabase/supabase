import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useProfile } from 'lib/profile'
import type { ResponseError } from 'types'
import { getOrganizations } from './fetchers'
import { organizationKeys } from './keys'

export type OrganizationsData = Awaited<ReturnType<typeof getOrganizations>>
export type OrganizationsError = ResponseError

export const useOrganizationsQuery = <TData = OrganizationsData>({
  enabled = true,
  ...options
}: UseQueryOptions<OrganizationsData, OrganizationsError, TData> = {}) => {
  const { profile } = useProfile()
  return useQuery<OrganizationsData, OrganizationsError, TData>(
    organizationKeys.list(),
    ({ signal }) => getOrganizations({ signal }),
    { enabled: enabled && profile !== undefined, ...options, staleTime: 30 * 60 * 1000 }
  )
}

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries(organizationKeys.list())
}
