import { useQuery } from '@tanstack/react-query'

import { fetchHandler } from 'data/fetchers'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { miscKeys } from './keys'

export async function getUserIPAddress() {
  try {
    const data = await fetchHandler(`${BASE_PATH}/api/get-ip-address`).then((res) => res.json())
    return data.ipAddress
  } catch (error) {
    throw error
  }
}

export type UserIPAddressData = Awaited<ReturnType<typeof getUserIPAddress>>
export type UserIPAddressError = ResponseError

export const useUserIPAddressQuery = <TData = UserIPAddressData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<UserIPAddressData, UserIPAddressError, TData> = {}) =>
  useQuery<UserIPAddressData, UserIPAddressError, TData>({
    queryKey: miscKeys.ipAddress(),
    queryFn: () => getUserIPAddress(),
    enabled: enabled && !IS_PLATFORM,
    ...options,
  })
