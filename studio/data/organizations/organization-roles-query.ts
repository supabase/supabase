import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { ResponseError, Role } from 'types'
import { organizationKeys } from './keys'

export type OrganizationRolesVariables = {
  slug?: string
}

export type OrganizationRolesResponse = {
  roles: Role[]
}

export async function getOrganizationRoles(
  { slug }: OrganizationRolesVariables,
  signal?: AbortSignal
) {
  if (!slug) {
    throw new Error('slug is required')
  }

  const data = await get(`${API_URL}/organizations/${slug}/roles`, {
    signal,
  })
  if (data.error) {
    throw data.error
  }

  return { roles: data } as OrganizationRolesResponse
}

export type OrganizationRolesData = Awaited<ReturnType<typeof getOrganizationRoles>>
export type OrganizationRolesError = ResponseError

export const useOrganizationRolesQuery = <TData = OrganizationRolesData>(
  { slug }: OrganizationRolesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationRolesData, OrganizationRolesError, TData> = {}
) =>
  useQuery<OrganizationRolesData, OrganizationRolesError, TData>(
    organizationKeys.roles(slug),
    ({ signal }) => getOrganizationRoles({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )

export const useOrganizationRolesPrefetch = ({ slug }: OrganizationRolesVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (slug) {
      client.prefetchQuery(organizationKeys.roles(slug), ({ signal }) =>
        getOrganizationRoles({ slug }, signal)
      )
    }
  }, [slug])
}
