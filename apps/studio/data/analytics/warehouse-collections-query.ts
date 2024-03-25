import { initial } from 'lodash'
import { QueryOptions, useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
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

  // TODO: Uncomment this code and remove the mock once the endpoint is implemented
  // const response = await get(`/platform/projects/{ref}/analytics/warehouse/collections`, {
  //   params: { path: { ref: projectRef } },
  //   signal,
  // })
  // if (response.error) {
  //   throw response.error
  // }

  // return response;

  return collectionsMock
}

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

const collectionsMock = [
  {
    id: 'web_analytics',
    name: 'web_analytics',
  },
  {
    id: 'usage',
    name: 'usage',
  },
] as const
