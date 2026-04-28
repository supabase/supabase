import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError, UseCustomMutationOptions } from '@/types'

export type ParseClientCodeResponse = {
  sql: string | undefined
  valid: boolean
}

export type ParseClientCodeVariables = {
  code: string
}

export async function generateSqlTitle({ code }: ParseClientCodeVariables) {
  try {
    const url = `${BASE_PATH}/api/ai/sql/parse-client-code`
    const headers = await constructHeaders({ 'Content-Type': 'application/json' })
    const response = await fetchHandler(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({ code }),
    }).then((res) => res.json())

    if (response.error) throw new Error(response.error)
    return response as ParseClientCodeResponse
  } catch (error) {
    throw error
  }
}

type ParseClientCodeData = Awaited<ReturnType<typeof generateSqlTitle>>

export const useParseClientCodeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ParseClientCodeData, ResponseError, ParseClientCodeVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ParseClientCodeData, ResponseError, ParseClientCodeVariables>({
    mutationFn: (vars) => generateSqlTitle(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to parse client code: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
