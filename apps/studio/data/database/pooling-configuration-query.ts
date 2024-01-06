import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PoolingConfigurationVariables = {
  projectRef: string
}

export async function getPoolingConfiguration(
  { projectRef }: PoolingConfigurationVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(`/platform/projects/{ref}/config/pgbouncer`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) throw error
  return data
}

export type PoolingConfigurationData = Awaited<ReturnType<typeof getPoolingConfiguration>>
export type PoolingConfigurationError = ResponseError

export const usePoolingConfigurationQuery = <TData = PoolingConfigurationData>(
  { projectRef }: PoolingConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PoolingConfigurationData, PoolingConfigurationError, TData> = {}
) =>
  useQuery<PoolingConfigurationData, PoolingConfigurationError, TData>(
    databaseKeys.poolingConfiguration(projectRef),
    ({ signal }) => getPoolingConfiguration({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
