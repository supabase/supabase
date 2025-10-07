import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useIsLoggedIn } from 'common'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { Permission, ResponseError } from 'types'
import { permissionKeys } from './keys'

export type PermissionsResponse = Permission[]

export async function getPermissions(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/permissions', { signal })
  if (error) {
    const statusCode = (!!error && typeof error === 'object' && (error as any).code) || 'unknown'

    // This is to avoid sending 4XX errors
    // But we still want to capture errors without a status code or 5XXs
    // since those may require investigation if they spike
    const sendError = statusCode >= 500 || statusCode === 'unknown'
    handleError(error, {
      alwaysCapture: sendError,
      sentryContext: {
        tags: {
          permissionsQuery: true,
          statusCode,
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
}: UseQueryOptions<PermissionsData, PermissionsError, TData> = {}) => {
  const isLoggedIn = useIsLoggedIn()

  return useQuery<PermissionsData, PermissionsError, TData>(
    permissionKeys.list(),
    ({ signal }) => getPermissions(signal),
    {
      ...options,
      enabled: IS_PLATFORM && enabled && isLoggedIn,
      staleTime: 5 * 60 * 1000,
    }
  )
}
