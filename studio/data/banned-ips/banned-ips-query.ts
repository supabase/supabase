import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { BannedIPKeys } from './keys'

export type BannedIPVariables = {
  projectRef?: string
  ip?: string
};

export type BannedIPsData = BannedIPVariables[];
export type BannedIPsError = ResponseError;

export async function getBannedIPs({ projectRef }: BannedIPVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  // @ts-ignore Just a sample here, TS lint will validate if the endpoint is valid
  const { data, error } = await post(`/v1/projects/{ref}/network-bans/retrieve`, {
    params: { 
      path: { ref: projectRef } 
    },
    signal,
  })
  // Log the error message if an error occurred
  if (error) {
    console.error('Error fetching banned IPs:', error);
    throw error;
  }

  // Log the data if it's available
  if (data) {
    console.log('Banned IPs Data:', data);
  }
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


