import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type ExistsNamespaceVariables = {
  catalogUri: string
  warehouse: string
  token: string
  namespace: string
}

async function checkNamespaceExists({
  catalogUri,
  warehouse,
  token,
  namespace,
}: ExistsNamespaceVariables) {
  const headers = await constructHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })

  const url = `${catalogUri}/v1/${warehouse}/namespaces/${namespace}`.replaceAll(/(?<!:)\/\//g, '/')

  try {
    const response = await fetchHandler(url, {
      headers,
      method: 'HEAD',
    })

    return response.status === 204
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceExistsData = Awaited<ReturnType<typeof checkNamespaceExists>>

export type IcebergNamespaceExistsError = ResponseError

export const useIcebergNamespaceExistsQuery = <TData = IcebergNamespaceExistsData>(
  params: ExistsNamespaceVariables,
  {
    ...options
  }: UseQueryOptions<IcebergNamespaceExistsData, IcebergNamespaceExistsError, TData> = {}
) => {
  return useQuery<IcebergNamespaceExistsData, IcebergNamespaceExistsError, TData>(
    storageKeys.icebergNamespace(params.catalogUri, params.warehouse, params.namespace),
    () => checkNamespaceExists(params),
    { ...options }
  )
}
