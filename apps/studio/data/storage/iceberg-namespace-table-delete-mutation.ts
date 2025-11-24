import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getOrRefreshTemporaryApiKey } from 'data/api-keys/temp-api-keys-utils'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type DeleteIcebergNamespaceTableVariables = {
  catalogUri: string
  warehouse: string
  namespace: string
  table: string
  projectRef?: string
}

const errorPrefix = 'Failed to delete Iceberg namespace table'

async function deleteIcebergNamespaceTable({
  projectRef,
  catalogUri,
  warehouse,
  namespace,
  table,
}: DeleteIcebergNamespaceTableVariables) {
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

    const url =
      `${catalogUri}/v1/${warehouse}/namespaces/${namespace}/tables/${table}?purgeRequested=true`.replaceAll(
        /(?<!:)\/\//g,
        '/'
      )

    const response = await fetchHandler(url, { headers, method: 'DELETE' })
    return response.status === 204
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceTableDeleteData = Awaited<ReturnType<typeof deleteIcebergNamespaceTable>>

export const useIcebergNamespaceTableDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IcebergNamespaceTableDeleteData,
    ResponseError,
    DeleteIcebergNamespaceTableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IcebergNamespaceTableDeleteData,
    ResponseError,
    DeleteIcebergNamespaceTableVariables
  >({
    mutationFn: (vars) => deleteIcebergNamespaceTable({ ...vars }),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespace({
          projectRef: variables.projectRef,
          catalog: variables.catalogUri,
          warehouse: variables.warehouse,
          namespace: variables.namespace,
        }),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete Iceberg namespace table: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
