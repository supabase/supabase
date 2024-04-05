import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import type { ResponseError } from 'types'
import { realtimeKeys } from './keys'

export type getChannelsVariables = {
  projectRef: string
  endpoint: string
  accessToken: string
}

export type RealtimeChannel = { name: string; inserted_at: string; updated_at: string; id: number }

const getChannels = async (
  { endpoint, accessToken }: getChannelsVariables,
  signal?: AbortSignal
) => {
  const response = await get(`${endpoint}/realtime/v1/api/channels`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: accessToken,
    },
    signal,
  })

  if (response.error) {
    throw response.error
  }
  return response as RealtimeChannel[]
}

export type ChannelsData = Awaited<ReturnType<typeof getChannels>>

export const useChannelsQuery = <TData = ChannelsData>(
  vars: getChannelsVariables,
  { enabled = true, ...options }: UseQueryOptions<ChannelsData, ResponseError, TData> = {}
) =>
  useQuery<ChannelsData, ResponseError, TData>(
    realtimeKeys.channels(vars.projectRef),
    ({ signal }) => getChannels(vars, signal),
    {
      enabled: enabled && typeof vars.projectRef !== 'undefined',
      ...options,
    }
  )
