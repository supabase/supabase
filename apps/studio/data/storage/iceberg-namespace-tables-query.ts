import { useQuery } from '@tanstack/react-query'

import { getOrRefreshTemporaryApiKey } from 'data/api-keys/temp-api-keys-utils'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

type GetNamespaceTablesVariables = {
  catalogUri: string
  warehouse: string
  namespace: string
  projectRef?: string
}

const errorPrefix = 'Failed to retrieve Iceberg namespace tables'

async function getNamespaceTables({
  projectRef,
  catalogUri,
  warehouse,
  namespace,
}: GetNamespaceTablesVariables) {
  try {
    if (!projectRef) throw new Error(`${errorPrefix}: projectRef is required`)

    const tempApiKeyObj = await getOrRefreshTemporaryApiKey(projectRef)
    const tempApiKey = tempApiKeyObj.apiKey

    let headers = new Headers()
    headers = await constructHeaders({
      'Content-Type': 'application/json',
      apikey: tempApiKey,
    })
    headers.delete('Authorization')

    const url = `${catalogUri}/v1/${warehouse}/namespaces/${namespace}/tables`.replaceAll(
      /(?<!:)\/\//g,
      '/'
    )

    const response = await fetchHandler(url, { headers, method: 'GET' })
    const result = await response.json()
    if (result.error) {
      if (result.error.message) throw new Error(`${errorPrefix}: ${result.error.message}`)
      else throw new Error(errorPrefix)
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
    enabled = true,
    ...options
  }: UseCustomQueryOptions<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData> = {}
) => {
  const { projectRef, catalogUri, warehouse, namespace } = params

  return useQuery<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData>({
    queryKey: storageKeys.icebergNamespaceTables({
      projectRef,
      warehouse,
      namespace,
      catalog: catalogUri,
    }),
    queryFn: () => getNamespaceTables({ ...params }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof warehouse !== 'undefined' &&
      typeof namespace !== 'undefined' &&
      typeof catalogUri !== 'undefined',
    ...options,
  })
}
