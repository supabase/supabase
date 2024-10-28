import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

type CollectionSchemaVariables = {
  projectRef: string
  collectionToken: string
}

export async function getCollectionSchema(
  { projectRef, collectionToken }: CollectionSchemaVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  // TODO: Remove type cast when codegen types are fixed
  const { data, error } = await get(
    `/platform/projects/{ref}/analytics/warehouse/collections/{collectionToken}/schema` as any,
    {
      params: { path: { ref: projectRef, collectionToken } },
      signal,
    } as any
  )

  if (error) handleError(error)

  return data
}

export type CollectionSchemaData = Awaited<ReturnType<typeof getCollectionSchema>>

export const useCollectionSchemaQuery = (
  { projectRef, collectionToken }: CollectionSchemaVariables,
  { enabled }: { enabled: boolean } = { enabled: true }
) =>
  useQuery(
    analyticsKeys.collectionSchema(projectRef, collectionToken),
    ({ signal }) => getCollectionSchema({ projectRef, collectionToken }, signal),
    {
      enabled: enabled && !!projectRef && !!collectionToken,
    }
  )
