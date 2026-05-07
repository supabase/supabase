import { useQuery } from '@tanstack/react-query'

import { fetchHandler } from 'data/fetchers'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { miscKeys } from './keys'

// Warn if the clock skew is greater than 2 minutes
const CLOCK_SKEW_THRESHOLD = 2 * 60 * 1000
// Check every 30 minutes
const CLOCK_SKEW_CHECK_INTERVAL = 30 * 60 * 1000

export async function getClockSkew() {
  try {
    const data = await fetchHandler(`${BASE_PATH}/api/get-utc-time`).then((res) => res.json())
    const serverTime = new Date(data.utcTime).getTime()
    const clientTime = new Date().getTime()
    const clockSkew = Math.abs(clientTime - serverTime)
    return clockSkew > CLOCK_SKEW_THRESHOLD
  } catch (error) {
    throw error
  }
}

export type ClockSkewData = Awaited<ReturnType<typeof getClockSkew>>
export type ClockSkewError = ResponseError

export const useClockSkewQuery = <TData = ClockSkewData>({
  enabled = true,
  refetchInterval = CLOCK_SKEW_CHECK_INTERVAL,
  ...options
}: UseCustomQueryOptions<ClockSkewData, ClockSkewError, TData> = {}) =>
  useQuery<ClockSkewData, ClockSkewError, TData>({
    queryKey: miscKeys.clockSkew(),
    queryFn: () => getClockSkew(),
    enabled: enabled && IS_PLATFORM,
    refetchInterval,
    ...options,
  })
