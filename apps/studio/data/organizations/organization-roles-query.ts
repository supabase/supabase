import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, Role } from 'types'
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
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/roles', {
    params: { path: { slug } },
    signal,
  })

  if (error) handleError(error)

  return { roles: data } as unknown as OrganizationRolesResponse
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
