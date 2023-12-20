import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'

import { get } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { Permission, ResponseError } from 'types'
import { permissionKeys } from './keys'

export type PermissionsResponse = Permission[]

export async function getPermissions(signal?: AbortSignal) {
  const response = await get(`${API_URL}/profile/permissions`, {
    signal,
  })
  if (response.error) throw response.error

  return response as PermissionsResponse
}

export type PermissionsData = Awaited<ReturnType<typeof getPermissions>>
export type PermissionsError = ResponseError

export const usePermissionsQuery = <TData = PermissionsData>(
  options: UseQueryOptions<PermissionsData, PermissionsError, TData> = {}
) =>
  useQuery<PermissionsData, PermissionsError, TData>(
    permissionKeys.list(),
    ({ signal }) => getPermissions(signal),
    {
      ...options,
      enabled: IS_PLATFORM && options.enabled,
      staleTime: 30 * 60 * 1000,
    }
  )

export const usePermissionsPrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(permissionKeys.list(), ({ signal }) => getPermissions(signal))
  }, [])
}
