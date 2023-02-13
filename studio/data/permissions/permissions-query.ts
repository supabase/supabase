import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { Permission } from 'types'
import { permissionKeys } from './keys'

export type PermissionsResponse = Permission[]

export async function getPermissions(signal?: AbortSignal) {
  const response = await get(`${API_URL}/profile/permissions`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as PermissionsResponse
}

export type PermissionsData = Awaited<ReturnType<typeof getPermissions>>
export type PermissionsError = unknown

export const usePermissionsQuery = <TData = PermissionsData>({
  enabled = true,
  ...options
}: UseQueryOptions<PermissionsData, PermissionsError, TData> = {}) =>
  useQuery<PermissionsData, PermissionsError, TData>(
    permissionKeys.list(),
    ({ signal }) => getPermissions(signal),
    options
  )

export const usePermissionsPrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(permissionKeys.list(), ({ signal }) => getPermissions(signal))
  }, [])
}
