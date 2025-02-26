import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { realtimeKeys } from './keys'

export type RealtimeConfigurationVariables = {
  projectRef?: string
}

export async function getRealtimeConfiguration(
  { projectRef }: RealtimeConfigurationVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/config/realtime`, {
    // @ts-expect-error [Joshen] I think API typing might be wrong here
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type RealtimeConfigurationData = Awaited<ReturnType<typeof getRealtimeConfiguration>>
export type RealtimeConfigurationError = ResponseError

export const useRealtimeConfigurationQuery = <TData = RealtimeConfigurationData>(
  { projectRef }: RealtimeConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<RealtimeConfigurationData, RealtimeConfigurationError, TData> = {}
) =>
  useQuery<RealtimeConfigurationData, RealtimeConfigurationError, TData>(
    realtimeKeys.configuration(projectRef),
    ({ signal }) => getRealtimeConfiguration({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
