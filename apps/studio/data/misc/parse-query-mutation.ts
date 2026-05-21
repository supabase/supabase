import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError, UseCustomMutationOptions } from '@/types'

type ParseSQLQueryVariables = { sql: string }
export type ParseSQLQueryResponse = {
  tables: string[]
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | undefined
}

export async function parseSQLQuery({ sql }: ParseSQLQueryVariables) {
  try {
    const url = `${BASE_PATH}/api/parse-query`

    const headers = await constructHeaders({ 'Content-Type': 'application/json' })
    const response = await fetchHandler(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({ sql }),
    }).then((res) => res.json())

    if (response.error) throw new Error(response.error)
    return response as ParseSQLQueryResponse
  } catch (error) {
    throw error
  }
}

type ParseSQLQueryData = Awaited<ReturnType<typeof parseSQLQuery>>

export const useParseSQLQueryMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ParseSQLQueryData, ResponseError, ParseSQLQueryVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ParseSQLQueryData, ResponseError, ParseSQLQueryVariables>({
    mutationFn: (vars) => parseSQLQuery(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to parse query: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
