import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type WarehouseCollectionsVariables = {
  projectRef: string
}

export type WarehouseCollectionsResponse = any

export async function getWarehouseCollections(
  { projectRef }: WarehouseCollectionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<WarehouseCollectionsResponse>(
    `${API_URL}/projects/${projectRef}/analytics/warehouse/collections`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type WarehouseCollectionsData = Awaited<ReturnType<typeof getWarehouseCollections>>
export type WarehouseCollectionsError = unknown

export const useWarehouseCollectionsQuery = <TData = WarehouseCollectionsData>(
  { projectRef }: WarehouseCollectionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseCollectionsData, WarehouseCollectionsError, TData> = {}
) =>
  useQuery<WarehouseCollectionsData, WarehouseCollectionsError, TData>(
    analyticsKeys.warehouseCollections(projectRef),
    ({ signal }) => getWarehouseCollections({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
