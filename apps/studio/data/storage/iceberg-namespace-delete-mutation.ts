import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTemporaryAPIKeyQuery } from 'data/api-keys/temp-api-keys-query'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type DeleteIcebergNamespaceVariables = {
  catalogUri: string
  warehouse: string
  namespace: string
}

const errorPrefix = 'Failed to delete Iceberg namespace'

async function deleteIcebergNamespace({
  catalogUri,
  warehouse,
  namespace,
  tempApiKey,
}: DeleteIcebergNamespaceVariables & { tempApiKey?: string }) {
  try {
    if (!tempApiKey) throw new Error(`${errorPrefix}: API Key missing`)

    let headers = new Headers()
    headers = await constructHeaders({
      'Content-Type': 'application/json',
      apikey: tempApiKey,
    })
    headers.delete('Authorization')

    const url = `${catalogUri}/v1/${warehouse}/namespaces/${namespace}`.replaceAll(
      /(?<!:)\/\//g,
      '/'
    )

    const response = await fetchHandler(url, {
      headers,
      method: 'DELETE',
    })
    return response.status === 204
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceDeleteData = Awaited<ReturnType<typeof deleteIcebergNamespace>>

export const useIcebergNamespaceDeleteMutation = ({
  projectRef,
  onSuccess,
  onError,
  ...options
}: { projectRef?: string } & Omit<
  UseCustomMutationOptions<
    IcebergNamespaceDeleteData,
    ResponseError,
    DeleteIcebergNamespaceVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { data } = useTemporaryAPIKeyQuery({ projectRef })
  const tempApiKey = data?.api_key

  return useMutation<IcebergNamespaceDeleteData, ResponseError, DeleteIcebergNamespaceVariables>({
    mutationFn: (vars) => deleteIcebergNamespace({ ...vars, tempApiKey }),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespaces({
          projectRef,
          catalog: variables.catalogUri,
          warehouse: variables.warehouse,
        }),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete Iceberg namespace: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
