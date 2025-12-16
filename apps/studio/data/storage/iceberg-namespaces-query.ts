import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

type GetNamespacesVariables = {
  warehouse?: string
  projectRef?: string
}

async function getNamespaces(
  { projectRef, warehouse }: GetNamespacesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!warehouse) throw new Error('warehouse is required')

  const { data, error } = await get('/platform/storage/{ref}/analytics-buckets/{id}/namespaces', {
    params: { path: { ref: projectRef, id: warehouse } },
    signal,
  })

  if (error) handleError(error)
  return data.data.map((x) => x.namespace).flat()
}

type IcebergNamespacesData = Awaited<ReturnType<typeof getNamespaces>>

export type IcebergNamespacesError = ResponseError

export const useIcebergNamespacesQuery = <TData = IcebergNamespacesData>(
  params: GetNamespacesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<IcebergNamespacesData, IcebergNamespacesError, TData> = {}
) => {
  const { projectRef, warehouse } = params

  return useQuery<IcebergNamespacesData, IcebergNamespacesError, TData>({
    queryKey: storageKeys.icebergNamespaces({
      projectRef,
      warehouse,
    }),
    queryFn: ({ signal }) => getNamespaces({ projectRef, warehouse }, signal),
    enabled:
      options &&
      typeof projectRef !== 'undefined' &&
      typeof warehouse !== 'undefined' &&
      warehouse.length > 0,
    ...options,
  })
}
