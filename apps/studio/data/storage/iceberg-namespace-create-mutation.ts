import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

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
  const headers = await constructHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })
  console.log(headers)

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
      throw new Error('Failed to create iceberg namespace')
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
  return useMutation<IcebergNamespaceCreateData, ResponseError, CreateIcebergNamespaceVariables>(
    (vars) => createIcebergNamespace(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create iceberg namespace: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
