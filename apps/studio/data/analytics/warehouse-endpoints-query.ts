import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { get } from 'data/fetchers'

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

  // [Jordi]: commented out because it's not used yet and will throw an error

  // const response = await get<WarehouseEndpointsResponse>(
  //   '/projects/{ref}/analytics/warehouse/endpoints',
  //   {
  //     params: { path: { ref: projectRef } },
  //   }
  // )
  // if (response.error) {
  //   throw response.error
  // }

  // return response
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
