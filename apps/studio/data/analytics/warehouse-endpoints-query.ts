import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type WarehouseEndpointsVariables = {
  projectRef: string
}

export type WarehouseEndpointsResponse = any

export async function getWarehouseEndpoints(
  { projectRef }: WarehouseEndpointsResponse,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<WarehouseEndpointsResponse>(
    `${API_URL}/projects/${projectRef}/analytics/warehouse/endpoints`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type WarehouseEndpointsData = Awaited<ReturnType<typeof getWarehouseEndpoints>>
export type WarehouseEndpointsError = unknown

export const useWarehouseEndpointsQuery = <TData = WarehouseEndpointsData>(
  { projectRef }: WarehouseEndpointsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseEndpointsData, WarehouseEndpointsError, TData> = {}
) =>
  useQuery<WarehouseEndpointsData, WarehouseEndpointsError, TData>(
    analyticsKeys.warehouseEndpoints(projectRef),
    ({ signal }) => getWarehouseEndpoints({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
