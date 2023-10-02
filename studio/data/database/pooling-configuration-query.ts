import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PoolingConfigurationVariables = {
  projectRef: string
}

export type PoolingConfiguration = {
  db_dns_name: string
  db_host: string
  db_name: string
  db_port: number
  db_ssl: boolean
  db_user: string
  default_pool_size: number | null
  ignore_startup_parameters: string
  inserted_at: string
  max_client_conn: number | null
  pgbouncer_enabled: boolean
  supavisor_enabled: boolean
  pgbouncer_status: string
  pool_mode: string
  connectionString: string
}

export async function getPoolingConfiguration(
  { projectRef }: PoolingConfigurationVariables,
  signal?: AbortSignal
) {
  const response = await get(`${API_URL}/projects/${projectRef}/config/pgbouncer`, { signal })
  if (response.error) throw response.error
  return response as PoolingConfiguration
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

export const usePoolingConfigurationPrefetch = ({ projectRef }: PoolingConfigurationVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(databaseKeys.poolingConfiguration(projectRef), ({ signal }) =>
        getPoolingConfiguration({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
