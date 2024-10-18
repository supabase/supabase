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
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  // TODO: Remove type cast when codegen types are fixed
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
  { enabled }: { enabled: boolean } = { enabled: true }
) =>
  useQuery(
    analyticsKeys.warehouseCollections(projectRef),
    ({ signal }) => getWarehouseCollections({ projectRef }, signal),
    {
      enabled: enabled && !!projectRef,
    }
  )
