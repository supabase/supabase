import { useQuery } from '@tanstack/react-query'
import { useIsLoggedIn } from 'common'

import { permissionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import { useService } from '@/lib/services/context'
import type { Permission, ResponseError, UseCustomQueryOptions } from '@/types'

export type PermissionsResponse = Permission[]

export async function getPermissions(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/permissions', { signal })
  if (error) {
    handleError(error, {
      sentryContext: {
        tags: {
          permissionsQuery: true,
        },
        contexts: {
          rawError: error,
        },
      },
    })
  }

  // [Joshen] TODO: Type this properly from the API
  return data as unknown as PermissionsResponse
}

export type PermissionsData = Awaited<ReturnType<typeof getPermissions>>
export type PermissionsError = ResponseError

export const usePermissionsQuery = <TData = PermissionsData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<PermissionsData, PermissionsError, TData> = {}) => {
  const isLoggedIn = useIsLoggedIn()
  const { getPermissions: fetchPermissions } = useService('permissions')

  return useQuery<PermissionsData, PermissionsError, TData>({
    queryKey: permissionKeys.list(),
    queryFn: ({ signal }) => fetchPermissions(signal),
    ...options,
    enabled: IS_PLATFORM && enabled && isLoggedIn,
    staleTime: 5 * 60 * 1000,
  })
}
