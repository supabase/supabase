import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type WarehouseBackendsVariables = {
  projectRef: string
}

export type WarehouseBackendsResponse = any

export async function getWarehouseBackends(
  { projectRef }: WarehouseBackendsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<WarehouseBackendsResponse>(
    `${API_URL}/projects/${projectRef}/analytics/warehouse/backends`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type WarehouseBackendsData = Awaited<ReturnType<typeof getWarehouseBackends>>
export type WarehouseBackendsError = unknown

export const useWarehouseBackendsQuery = <TData = WarehouseBackendsData>(
  { projectRef }: WarehouseBackendsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseBackendsData, WarehouseBackendsError, TData> = {}
) =>
  useQuery<WarehouseBackendsData, WarehouseBackendsError, TData>(
    analyticsKeys.warehouseBackends(projectRef),
    ({ signal }) => getWarehouseBackends({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
