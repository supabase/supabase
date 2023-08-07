import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { BasePermission, ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationRolePermissionsVariables = {
  slug?: string
  roleId: number
}

export type OrganizationRolePermissionsResponse = {
  id: number
  name: string
  description?: string
  permissions?: BasePermission[]
  base_role_id?: number
}

export async function getOrganizationRolePermisions(
  { slug, roleId }: OrganizationRolePermissionsVariables,
  signal?: AbortSignal
) {
  if (!slug) {
    throw new Error('slug is required')
  }

  const data = await get(`${API_URL}/organizations/${slug}/roles/${roleId}`, {
    signal,
  })
  if (data.error) {
    throw data.error
  }

  return data as OrganizationRolePermissionsResponse
}

export type OrganizationRolePermissionsData = Awaited<
  ReturnType<typeof getOrganizationRolePermisions>
>
export type OrganizationRolePermissionsError = ResponseError

export const useOrganizationRolePermissionsQuery = <TData = OrganizationRolePermissionsData>(
  { slug, roleId }: OrganizationRolePermissionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationRolePermissionsData, OrganizationRolePermissionsError, TData> = {}
) =>
  useQuery<OrganizationRolePermissionsData, OrganizationRolePermissionsError, TData>(
    organizationKeys.rolePermissions(slug, roleId),
    ({ signal }) => getOrganizationRolePermisions({ slug, roleId }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )

export const useOrganizationRolePermissionsPrefetch = ({
  slug,
  roleId,
}: OrganizationRolePermissionsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (slug) {
      client.prefetchQuery(organizationKeys.rolePermissions(slug, roleId), ({ signal }) =>
        getOrganizationRolePermisions({ slug, roleId }, signal)
      )
    }
  }, [slug])
}
