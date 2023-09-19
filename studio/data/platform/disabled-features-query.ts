import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { platformKeys } from './keys'
import { IS_PLATFORM } from 'lib/constants'

export type Feature = 'auth' | 'storage' | 'user-management' | 'billing'

export async function getDisabledFeatures(signal?: AbortSignal) {
  // if (!IS_PLATFORM) {
    return (process.env.NEXT_PUBLIC_DISABLED_FEATURES?.split(',') ?? []) as Feature[]
  // }

  // const { data, error } = await get(`/platform/disabled-features`, {
  //   signal,
  // })
  // if (error) throw error

  // return data
}

export type DisabledFeaturesData = Awaited<ReturnType<typeof getDisabledFeatures>>
export type DisabledFeaturesError = ResponseError

export const useDisabledFeaturesQuery = <TData = DisabledFeaturesData>({
  enabled = true,
  ...options
}: UseQueryOptions<DisabledFeaturesData, DisabledFeaturesError, TData> = {}) =>
  useQuery<DisabledFeaturesData, DisabledFeaturesError, TData>(
    platformKeys.features(),
    ({ signal }) => getDisabledFeatures(signal),
    { enabled: enabled, ...options }
  )
