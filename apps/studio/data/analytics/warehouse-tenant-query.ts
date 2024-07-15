import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

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
  const { data, error } = await get(`/platform/projects/{ref}/analytics/warehouse/tenant`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type WarehouseTenantData = Awaited<ReturnType<typeof getWarehouseTenant>>
export type WarehouseTenantError = ResponseError

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
      enabled: enabled && !!projectRef,
      staleTime: Infinity,
      // 2H mins cache time
      cacheTime: 120 * 60 * 1000,
      refetchOnMount: false,
      refetchInterval: false,
      ...options,
    }
  )
