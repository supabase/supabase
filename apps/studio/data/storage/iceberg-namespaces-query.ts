import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type GetNamespacesVariables = {
  catalogUri: string
  warehouse: string
  token: string
}

async function getNamespaces({ catalogUri, warehouse, token }: GetNamespacesVariables) {
  const headers = await constructHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })

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
  { ...options }: UseQueryOptions<IcebergNamespacesData, IcebergNamespacesError, TData> = {}
) => {
  return useQuery<IcebergNamespacesData, IcebergNamespacesError, TData>(
    storageKeys.icebergNamespaces(params.catalogUri, params.warehouse),
    () => getNamespaces(params),
    { ...options }
  )
}
