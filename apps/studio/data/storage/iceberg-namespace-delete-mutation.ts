import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type IcebergNamespaceDeleteVariables = {
  catalogUri: string
  warehouse: string
  token: string
  namespace: string
}

// [Joshen] Investigate if we can use the temp API keys here
async function deleteIcebergNamespace({
  catalogUri,
  warehouse,
  token,
  namespace,
}: IcebergNamespaceDeleteVariables) {
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

  const url = `${catalogUri}/v1/${warehouse}/namespaces/${namespace}`.replaceAll(/(?<!:)\/\//g, '/')

  try {
    const response = await fetchHandler(url, {
      headers,
      method: 'DELETE',
    })

    const result = await response.json()
    if (result.error) {
      if (result.error.message) {
        throw new Error(result.error.message)
      }
      throw new Error('Failed to delete Iceberg namespace')
    }
    return result
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceDeleteData = Awaited<ReturnType<typeof deleteIcebergNamespace>>

export const useIcebergNamespaceDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IcebergNamespaceDeleteData,
    ResponseError,
    IcebergNamespaceDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IcebergNamespaceDeleteData, ResponseError, IcebergNamespaceDeleteVariables>({
    mutationFn: (vars) => deleteIcebergNamespace(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespace(
          variables.catalogUri,
          variables.warehouse,
          variables.namespace
        ),
      })
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespaces(variables.catalogUri, variables.warehouse),
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
