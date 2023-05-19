import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { Organization } from 'types'
import { organizationKeys } from './keys'

export type OrganizationsResponse = Organization[]

export async function getOrganizations(signal?: AbortSignal) {
  const data = await get(`${API_URL}/organizations`, { signal })
  if (data.error) throw data.error

  return data as OrganizationsResponse
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganizations>>
export type OrganizationsError = unknown

export const useOrganizationsQuery = <TData = OrganizationsData>({
  enabled = true,
  ...options
}: UseQueryOptions<OrganizationsData, OrganizationsError, TData> = {}) =>
  useQuery<OrganizationsData, OrganizationsError, TData>(
    organizationKeys.list(),
    ({ signal }) => getOrganizations(signal),
    { enabled: enabled, ...options }
  )

export const useOrganizationsPrefetch = () => {
  const client = useQueryClient()

  return useCallback(
    () => client.prefetchQuery(organizationKeys.list(), ({ signal }) => getOrganizations(signal)),
    []
  )
}
