import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTemporaryAPIKeyQuery } from 'data/api-keys/temp-api-keys-query'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type CreateIcebergNamespaceVariables = {
  catalogUri: string
  warehouse: string
  namespace: string
}

const errorPrefix = 'Failed to create Iceberg namespace'

async function createIcebergNamespace({
  catalogUri,
  warehouse,
  namespace,
  tempApiKey,
}: CreateIcebergNamespaceVariables & { tempApiKey?: string }) {
  try {
    if (!tempApiKey) throw new Error(`${errorPrefix}: API Key missing`)

    let headers = new Headers()
    headers = await constructHeaders({
      'Content-Type': 'application/json',
      apikey: tempApiKey,
    })
    headers.delete('Authorization')

    const url = `${catalogUri}/v1/${warehouse}/namespaces`.replaceAll(/(?<!:)\/\//g, '/')

    const response = await fetchHandler(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({ namespace: namespace }),
    })
    const result = await response.json()
    if (result.error) {
      if (result.error.message) throw new Error(`${errorPrefix}: ${result.error.message}`)
      else throw new Error(errorPrefix)
    }

    return result
  } catch (error) {
    handleError(error)
  }
}

type IcebergNamespaceCreateData = Awaited<ReturnType<typeof createIcebergNamespace>>

export const useIcebergNamespaceCreateMutation = ({
  projectRef,
  onSuccess,
  onError,
  ...options
}: { projectRef?: string } & Omit<
  UseCustomMutationOptions<
    IcebergNamespaceCreateData,
    ResponseError,
    CreateIcebergNamespaceVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { data } = useTemporaryAPIKeyQuery({ projectRef })
  const tempApiKey = data?.api_key

  return useMutation<IcebergNamespaceCreateData, ResponseError, CreateIcebergNamespaceVariables>({
    mutationFn: (vars) => createIcebergNamespace({ ...vars, tempApiKey }),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespace(
          variables.catalogUri,
          variables.warehouse,
          variables.namespace
        ),
      })
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespaces({
          catalog: variables.catalogUri,
          warehouse: variables.warehouse,
        }),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (data.message === 'Request failed with status code 409') {
        toast.error(`A namespace named ${variables.namespace} already exists in the catalog.`)
        return
      }
      if (onError === undefined) {
        toast.error(`Failed to create Iceberg namespace: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
