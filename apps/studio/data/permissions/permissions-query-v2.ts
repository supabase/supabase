import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useIsLoggedIn } from 'common'

import { permissionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { PermissionV2, ResponseError, UseCustomQueryOptions } from '@/types'


export async function getPermissionsV2(signal?: AbortSignal) {
  // @ts-expect-error - we need to update api type for studio
  const { data, error } = await get('/platform/profile/permissions/v2', { signal })
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
  return data as unknown as PermissionV2
}

export type PermissionsV2Data = Awaited<ReturnType<typeof getPermissionsV2>>
export type PermissionsV2Error = ResponseError

export const usePermissionsQueryV2 = <TData = PermissionsV2Data>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<PermissionsV2Data, PermissionsV2Error, TData> = {}) => {
  const isLoggedIn = useIsLoggedIn()

  return useQuery<PermissionsV2Data, PermissionsV2Error, TData>({
    queryKey: permissionKeys.listV2(),
    queryFn: ({ signal }) => getPermissionsV2(signal),
    ...options,
    enabled: IS_PLATFORM && enabled && isLoggedIn,
    staleTime: 5 * 60 * 1000,
  })
}

export function invalidatePermissionsQueryV2(client: QueryClient) {
  return client.invalidateQueries({ queryKey: permissionKeys.listV2() })
}
