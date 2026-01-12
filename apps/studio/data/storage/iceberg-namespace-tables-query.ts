import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

type GetNamespaceTablesVariables = {
  warehouse?: string
  namespace?: string
  projectRef?: string
}

async function getNamespaceTables(
  { projectRef, warehouse, namespace }: GetNamespaceTablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!namespace) throw new Error('namespace is required')
  if (!warehouse) throw new Error('warehouse is required')

  const { data, error } = await get(
    '/platform/storage/{ref}/analytics-buckets/{id}/namespaces/{namespace}/tables',
    {
      params: { path: { ref: projectRef, id: warehouse, namespace } },
      signal,
    }
  )

  if (error) handleError(error)
  return data.data.map((x) => x.name)
}

type IcebergNamespaceTablesData = Awaited<ReturnType<typeof getNamespaceTables>>

export type IcebergNamespaceTablesError = ResponseError

export const useIcebergNamespaceTablesQuery = <TData = IcebergNamespaceTablesData>(
  params: GetNamespaceTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData> = {}
) => {
  const { projectRef, warehouse, namespace } = params

  return useQuery<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData>({
    queryKey: storageKeys.icebergNamespaceTables({
      projectRef,
      warehouse,
      namespace,
    }),
    queryFn: () => getNamespaceTables({ ...params }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof warehouse !== 'undefined' &&
      typeof namespace !== 'undefined',
    ...options,
  })
}
