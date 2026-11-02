import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { useIsLoggedIn } from 'common'

import { permissionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export async function getPermissionsV2(signal?: AbortSignal) {
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
  return data
}

export type PermissionsV2Data = Awaited<ReturnType<typeof getPermissionsV2>>
export type PermissionsV2Error = ResponseError

export const permissionsQueryOptionsV2 = () =>
  queryOptions({
    queryKey: permissionKeys.listV2(),
    queryFn: ({ signal }) => getPermissionsV2(signal),
    enabled: IS_PLATFORM,
    staleTime: 5 * 60 * 1000,
  })

export const usePermissionsQueryV2 = <TData = PermissionsV2Data>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<
  PermissionsV2Data,
  PermissionsV2Error,
  TData,
  ReturnType<typeof permissionKeys.listV2>
> = {}) => {
  const isLoggedIn = useIsLoggedIn()
  const { queryKey, queryFn } = permissionsQueryOptionsV2()

  return useQuery<
    PermissionsV2Data,
    PermissionsV2Error,
    TData,
    ReturnType<typeof permissionKeys.listV2>
  >({
    queryKey,
    queryFn,
    ...options,
    enabled: IS_PLATFORM && enabled && isLoggedIn,
    staleTime: 5 * 60 * 1000,
  })
}

export function invalidatePermissionsQueryV2(client: QueryClient) {
  return client.invalidateQueries({ queryKey: permissionKeys.listV2() })
}
