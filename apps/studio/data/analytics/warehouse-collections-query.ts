import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

type WarehouseCollectionsVariables = {
  projectRef: string
}

export async function getWarehouseCollections(
  { projectRef }: WarehouseCollectionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef || projectRef === 'undefined') {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get(`/platform/projects/{ref}/analytics/warehouse/collections`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type WarehouseCollectionsData = Awaited<ReturnType<typeof getWarehouseCollections>>

export const useWarehouseCollectionsQuery = (
  { projectRef }: WarehouseCollectionsVariables,
  { enabled }: { enabled: boolean }
) =>
  useQuery(
    analyticsKeys.warehouseCollections(projectRef),
    ({ signal }) => getWarehouseCollections({ projectRef }, signal),
    {
      enabled: !!projectRef || enabled,
    }
  )
