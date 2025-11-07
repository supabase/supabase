import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type DeleteIcebergNamespaceTableVariables = {
  catalogUri: string
  warehouse: string
  token: string
  namespace: string
  table: string
}

// [Joshen] Investigate if we can use the temp API keys here
async function deleteIcebergNamespaceTable({
  catalogUri,
  warehouse,
  token,
  namespace,
  table,
}: DeleteIcebergNamespaceTableVariables) {
  let headers = new Headers()
  // handle both secret key and service role key
  if (token.startsWith('sb_secret_')) {
    headers = await constructHeaders({
      'Content-Type': 'application/json',
      apikey: `${token}`,
    })
    headers.delete('Authorization')
  } else {
    headers = await constructHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    })
  }

  const url =
    `${catalogUri}/v1/${warehouse}/namespaces/${namespace}/tables/${table}?purgeRequested=true`.replaceAll(
      /(?<!:)\/\//g,
      '/'
    )

  try {
    const response = await fetchHandler(url, {
      headers,
      method: 'DELETE',
    })
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
    mutationFn: (vars) => deleteIcebergNamespaceTable(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespace(
          variables.catalogUri,
          variables.warehouse,
          variables.namespace
        ),
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
