import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { realtimeKeys } from './keys'

export type RealtimeConfigurationVariables = {
  projectRef?: string
}

export const REALTIME_DEFAULT_CONFIG = {
  private_only: false,
  connection_pool: 2,
  max_concurrent_users: 200,
  max_events_per_second: 100,
  max_bytes_per_second: 100000,
  max_channels_per_client: 100,
  max_joins_per_second: 100,
  max_presence_events_per_second: 100,
  max_payload_size_in_kb: 100,
  suspend: false,
}

export async function getRealtimeConfiguration(
  { projectRef }: RealtimeConfigurationVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/config/realtime`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    if ((error as ResponseError).message === 'Custom realtime config for a project not found') {
      return REALTIME_DEFAULT_CONFIG
    } else {
      handleError(error)
    }
  }
  return data
}

export type RealtimeConfigurationData = Awaited<ReturnType<typeof getRealtimeConfiguration>>
export type RealtimeConfigurationError = ResponseError

export const useRealtimeConfigurationQuery = <TData = RealtimeConfigurationData>(
  { projectRef }: RealtimeConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RealtimeConfigurationData, RealtimeConfigurationError, TData> = {}
) =>
  useQuery<RealtimeConfigurationData, RealtimeConfigurationError, TData>({
    queryKey: realtimeKeys.configuration(projectRef),
    queryFn: ({ signal }) => getRealtimeConfiguration({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
    ...options,
  })
