import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export const FIXED_ROLE_ORDER = ['Owner', 'Administrator', 'Developer', 'Read-only']
export type OrganizationRolesVariables = { slug?: string }
export type OrganizationRolesResponse = components['schemas']['OrganizationRoleResponseV2']
export type OrganizationRole = components['schemas']['OrganizationRoleV2']

export async function getOrganizationRoles(
  { slug }: OrganizationRolesVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/roles', {
    params: { path: { slug } },
    headers: { Version: '2' },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationRolesData = Awaited<ReturnType<typeof getOrganizationRoles>>
export type OrganizationRolesError = ResponseError

export const useOrganizationRolesV2Query = <TData = OrganizationRolesData>(
  { slug }: OrganizationRolesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationRolesData, OrganizationRolesError, TData> = {}
) =>
  useQuery<OrganizationRolesData, OrganizationRolesError, TData>(
    organizationKeys.rolesV2(slug),
    ({ signal }) => getOrganizationRoles({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      select: (data) => {
        return {
          ...data,
          org_scoped_roles: data.org_scoped_roles.sort((a, b) => {
            return FIXED_ROLE_ORDER.indexOf(a.name) - FIXED_ROLE_ORDER.indexOf(b.name)
          }),
        } as any
      },
      ...options,
    }
  )
