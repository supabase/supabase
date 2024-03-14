import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationRolesV2Variables = {
  slug?: string
}

export type OrganizationRolesv2Response = components['schemas']['RoleResponseV2']

export async function getOrganizationRolesV2(
  { slug }: OrganizationRolesV2Variables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/roles', {
    params: { path: { slug } },
    headers: { Version: '2' },
    signal,
  })

  if (error) return handleError(error)
  return data
}

export type OrganizationRolesV2Data = Awaited<ReturnType<typeof getOrganizationRolesV2>>
export type OrganizationRolesV2Error = ResponseError

export const useOrganizationRolesV2Query = <TData = OrganizationRolesV2Data>(
  { slug }: OrganizationRolesV2Variables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationRolesV2Data, OrganizationRolesV2Error, TData> = {}
) =>
  useQuery<OrganizationRolesV2Data, OrganizationRolesV2Error, TData>(
    organizationKeys.rolesV2(slug),
    ({ signal }) => getOrganizationRolesV2({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
