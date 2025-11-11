import { useQuery } from '@tanstack/react-query'

import { useTemporaryAPIKeyQuery } from 'data/api-keys/temp-api-keys-query'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

type GetNamespacesVariables = {
  catalogUri: string
  warehouse: string
  projectRef?: string
}

// [Joshen] Investigate if we can use the temp API keys here
async function getNamespaces({
  catalogUri,
  warehouse,
  tempApiKey,
}: GetNamespacesVariables & { tempApiKey?: string }) {
  console.log('getNamespaces', { catalogUri, warehouse, tempApiKey })

  let headers = new Headers()
  headers = await constructHeaders({
    'Content-Type': 'application/json',
    apikey: tempApiKey ?? '',
  })
  headers.delete('Authorization')

  const url = `${catalogUri}/v1/${warehouse}/namespaces`.replaceAll(/(?<!:)\/\//g, '/')

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
      throw new Error('Failed to get iceberg namespaces')
    }
    const r = result as { namespaces: string[][] }
    return r.namespaces.flat()
  } catch (error) {
    handleError(error)
  }
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
  const { projectRef, catalogUri, warehouse } = params
  const { data } = useTemporaryAPIKeyQuery({ projectRef })
  const tempApiKey = data?.api_key

  return useQuery<IcebergNamespacesData, IcebergNamespacesError, TData>({
    queryKey: storageKeys.icebergNamespaces({
      projectRef,
      warehouse,
      catalog: catalogUri,
      apikey: tempApiKey,
    }),
    queryFn: () => getNamespaces({ ...params, tempApiKey }),
    enabled:
      options &&
      typeof projectRef !== 'undefined' &&
      typeof tempApiKey !== 'undefined' &&
      typeof catalogUri !== 'undefined' &&
      typeof warehouse !== 'undefined',
    ...options,
  })
}
