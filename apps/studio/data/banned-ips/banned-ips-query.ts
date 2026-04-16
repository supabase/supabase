import { useQuery } from '@tanstack/react-query'

import { BannedIPKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type BannedIPVariables = {
  projectRef?: string
}

export type BannedIPsError = ResponseError

const BANNED_IPS_QUERY_TIMEOUT_MS = 5_000

function getBannedIPsAbortSignal(signal?: AbortSignal) {
  const timeoutSignal = AbortSignal.timeout(BANNED_IPS_QUERY_TIMEOUT_MS)

  if (!signal) return timeoutSignal
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeoutSignal])
  }

  // AbortSignal.any unavailable (older browsers): prefer the timeout signal so
  // the 5 s cap is always enforced, even at the cost of losing React Query's
  // own cancellation signal on this path.
  return timeoutSignal
}

export async function getBannedIPs({ projectRef }: BannedIPVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(`/v1/projects/{ref}/network-bans/retrieve`, {
    params: { path: { ref: projectRef } },
    signal: getBannedIPsAbortSignal(signal),
  })

  if (error) handleError(error)
  return data
}

export type IPData = Awaited<ReturnType<typeof getBannedIPs>>
export type IPError = ResponseError

export const useBannedIPsQuery = <TData = IPData>(
  { projectRef }: BannedIPVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<IPData, IPError, TData> = {}
) =>
  useQuery<IPData, IPError, TData>({
    queryKey: BannedIPKeys.list(projectRef),
    queryFn: ({ signal }) => getBannedIPs({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    ...options,
  })
