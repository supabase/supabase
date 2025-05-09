import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ResponseData } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails.types'
import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

export type EdgeFunctionTestResponse = {
  title: string
  description: string
}

export type EdgeFunctionTestVariables = {
  url: string
  method: string
  body: string
  headers: { [key: string]: string }
}

export async function testEdgeFunction({ url, method, body, headers }: EdgeFunctionTestVariables) {
  const defaultHeaders = await constructHeaders()

  const response = await fetchHandler(`${BASE_PATH}/api/edge-functions/test`, {
    method: 'POST',
    headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method, body, headers }),
  })

  let data: any

  try {
    data = await response.json()
  } catch {}

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to test edge function', {
      cause: { status: data.status },
    })
  }

  return data as ResponseData
}

type EdgeFunctionTestData = Awaited<ReturnType<typeof testEdgeFunction>>

export const useEdgeFunctionTestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EdgeFunctionTestData, ResponseError, EdgeFunctionTestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<EdgeFunctionTestData, ResponseError, EdgeFunctionTestVariables>(
    (vars) => testEdgeFunction(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to test edge function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
