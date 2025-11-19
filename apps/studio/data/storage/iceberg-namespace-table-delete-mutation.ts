import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTemporaryAPIKeyQuery } from 'data/api-keys/temp-api-keys-query'
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
  catalogUri,
  warehouse,
  namespace,
  table,
  tempApiKey,
}: DeleteIcebergNamespaceTableVariables & { tempApiKey?: string }) {
  try {
    if (!tempApiKey) throw new Error(`${errorPrefix}: API Key missing`)

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
    const result = await response.json()
    if (result.error) {
      if (result.error.message) throw new Error(`${errorPrefix}: ${result.error.message}`)
      else throw new Error(errorPrefix)
    }

    return response.status === 204
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceTableDeleteData = Awaited<ReturnType<typeof deleteIcebergNamespaceTable>>

export const useIcebergNamespaceTableDeleteMutation = ({
  projectRef,
  onSuccess,
  onError,
  ...options
}: { projectRef?: string } & Omit<
  UseCustomMutationOptions<
    IcebergNamespaceTableDeleteData,
    ResponseError,
    DeleteIcebergNamespaceTableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { data } = useTemporaryAPIKeyQuery({ projectRef })
  const tempApiKey = data?.api_key

  return useMutation<
    IcebergNamespaceTableDeleteData,
    ResponseError,
    DeleteIcebergNamespaceTableVariables
  >({
    mutationFn: (vars) => deleteIcebergNamespaceTable({ ...vars, tempApiKey }),
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
