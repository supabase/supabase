import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError, UseCustomMutationOptions } from '@/types'

export type ParseClientCodeResponse = {
  // Named unchecked_sql to highlight that this SQL must never be run
  // automatically without user confirmation — it is AI-generated and may not
  // be correct.
  unchecked_sql: UntrustedSqlFragment | undefined
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
    return {
      valid: response.valid as boolean,
      unchecked_sql: response.sql != null ? untrustedSql(response.sql as string) : undefined,
    } satisfies ParseClientCodeResponse
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
