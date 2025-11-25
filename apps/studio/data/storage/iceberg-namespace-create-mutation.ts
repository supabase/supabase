import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getOrRefreshTemporaryApiKey } from 'data/api-keys/temp-api-keys-utils'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type CreateIcebergNamespaceVariables = {
  projectRef?: string
  catalogUri: string
  warehouse: string
  namespace: string
}

const errorPrefix = 'Failed to create Iceberg namespace'

async function createIcebergNamespace({
  projectRef,
  catalogUri,
  warehouse,
  namespace,
}: CreateIcebergNamespaceVariables) {
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
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IcebergNamespaceCreateData,
    ResponseError,
    CreateIcebergNamespaceVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IcebergNamespaceCreateData, ResponseError, CreateIcebergNamespaceVariables>({
    mutationFn: (vars) => createIcebergNamespace({ ...vars }),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespace({
          projectRef: variables.projectRef,
          catalog: variables.catalogUri,
          warehouse: variables.warehouse,
          namespace: variables.namespace,
        }),
      })
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespaces({
          projectRef: variables.projectRef,
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
