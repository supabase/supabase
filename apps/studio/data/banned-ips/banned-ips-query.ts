import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { BannedIPKeys } from './keys'

export type BannedIPVariables = {
  projectRef?: string
}

export type BannedIPsData = BannedIPVariables[]
export type BannedIPsError = ResponseError

export async function getBannedIPs({ projectRef }: BannedIPVariables, signal?: AbortSignal) {
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
  { enabled = true, ...options }: UseQueryOptions<IPData, IPError, TData> = {}
) =>
  useQuery<IPData, IPError, TData>(
    BannedIPKeys.list(projectRef),
    ({ signal }) => getBannedIPs({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
