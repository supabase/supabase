import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type GetNamespaceTablesVariables = {
  catalogUri: string
  warehouse: string
  token: string
  namespace: string
}

async function getNamespaceTables({
  catalogUri,
  warehouse,
  token,
  namespace,
}: GetNamespaceTablesVariables) {
  const headers = await constructHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })

  const url = `${catalogUri}/v1/${warehouse}/namespaces/${namespace}/tables`.replaceAll(
    /(?<!:)\/\//g,
    '/'
  )

  try {
    const response = await fetchHandler(url, {
      headers,
      method: 'GET',
    })

    const result = await response.json()
    if (result.error) {
      if (result.error.message) {
        throw new Error(result.error.message)
      }
      throw new Error('Failed to get iceberg namespace')
    }
    const r = result as { identifiers: { name: string; namespace: string[] }[] }
    return r.identifiers.map((i) => i.name)
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceTablesData = Awaited<ReturnType<typeof getNamespaceTables>>

export type IcebergNamespaceTablesError = ResponseError

export const useIcebergNamespaceTablesQuery = <TData = IcebergNamespaceTablesData>(
  params: GetNamespaceTablesVariables,
  {
    ...options
  }: UseQueryOptions<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData> = {}
) => {
  return useQuery<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData>(
    storageKeys.icebergNamespaceTables(params.catalogUri, params.warehouse, params.namespace),
    () => getNamespaceTables(params),
    { ...options }
  )
}
