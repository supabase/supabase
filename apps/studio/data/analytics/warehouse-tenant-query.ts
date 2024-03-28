import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type WarehouseTenantVariables = {
  projectRef: string
}

export type WarehouseTenantResponse = any

export async function getWarehouseTenant(
  { projectRef }: WarehouseTenantVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<WarehouseTenantResponse>(
    `${API_URL}/projects/${projectRef}/analytics/warehouse/tenant`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type WarehouseTenantData = Awaited<ReturnType<typeof getWarehouseTenant>>
export type WarehouseTenantError = unknown

export const useWarehouseTenantQuery = <TData = WarehouseTenantData>(
  { projectRef }: WarehouseTenantVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseTenantData, WarehouseTenantError, TData> = {}
) =>
  useQuery<WarehouseTenantData, WarehouseTenantError, TData>(
    analyticsKeys.warehouseTenant(projectRef),
    ({ signal }) => getWarehouseTenant({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      staleTime: Infinity,
      // 2H mins cache time
      cacheTime: 120 * 60 * 1000,
      refetchOnMount: false,
      refetchInterval: false,
      ...options,
    }
  )
