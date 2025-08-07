import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type CreateIcebergNamespaceVariables = {
  catalogUri: string
  warehouse: string
  token: string
  namespace: string
}

async function createIcebergNamespace({
  catalogUri,
  warehouse,
  token,
  namespace,
}: CreateIcebergNamespaceVariables) {
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

  const url = `${catalogUri}/v1/${warehouse}/namespaces`.replaceAll(/(?<!:)\/\//g, '/')

  try {
    const response = await fetchHandler(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        namespace: namespace,
      }),
    })

    const result = await response.json()
    if (result.error) {
      if (result.error.message) {
        throw new Error(result.error.message)
      }
      throw new Error('Failed to create Iceberg namespace')
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
  UseMutationOptions<IcebergNamespaceCreateData, ResponseError, CreateIcebergNamespaceVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IcebergNamespaceCreateData, ResponseError, CreateIcebergNamespaceVariables>(
    (vars) => createIcebergNamespace(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(
          storageKeys.icebergNamespace(
            variables.catalogUri,
            variables.warehouse,
            variables.namespace
          )
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if ((data.message = 'Request failed with status code 409')) {
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
    }
  )
}
