import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'

import { BannedIPKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type BannedIPVariables = { projectRef?: string }

export async function getBannedIPs({ projectRef }: BannedIPVariables, signal: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(`/v1/projects/{ref}/network-bans/retrieve`, {
    params: { path: { ref: projectRef } },
    signal,
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
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    ...options,
  })
