import { useQuery } from '@tanstack/react-query'

import { useTemporaryAPIKeyQuery } from 'data/api-keys/temp-api-keys-query'
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
  catalogUri,
  warehouse,
  namespace,
  tempApiKey,
}: GetNamespaceTablesVariables & { tempApiKey?: string }) {
  try {
    if (!tempApiKey) throw new Error(`${errorPrefix}: API Key missing`)

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
  const { data } = useTemporaryAPIKeyQuery({ projectRef })
  const tempApiKey = data?.api_key

  return useQuery<IcebergNamespaceTablesData, IcebergNamespaceTablesError, TData>({
    queryKey: storageKeys.icebergNamespaceTables({
      projectRef,
      warehouse,
      namespace,
      catalog: catalogUri,
    }),
    queryFn: () => getNamespaceTables({ ...params, tempApiKey }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof tempApiKey !== 'undefined' &&
      typeof warehouse !== 'undefined' &&
      typeof namespace !== 'undefined' &&
      typeof catalogUri !== 'undefined',
    ...options,
  })
}
