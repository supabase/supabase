import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchPost } from 'data/fetchers'
import type { ResponseError } from 'types'

export type SqlPolicyGenerateVariables = {
  tableName: string
  schema?: string
  columns?: string[]
  projectRef: string
  connectionString: string
  orgSlug?: string
  message?: string
}

export type SqlPolicyGenerateResponse = { sql: string; name: string }[]

export async function generateSqlPolicy({
  tableName,
  schema,
  columns,
  projectRef,
  connectionString,
  orgSlug,
  message,
}: SqlPolicyGenerateVariables): Promise<SqlPolicyGenerateResponse> {
  const result = await fetchPost<SqlPolicyGenerateResponse>('/api/ai/sql/policy', {
    tableName,
    schema,
    columns,
    projectRef,
    connectionString,
    orgSlug,
    message,
  })
  if ('error' in result) throw result
  return result as SqlPolicyGenerateResponse
}

export const useSqlPolicyGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: {
  onSuccess?: (data: SqlPolicyGenerateResponse, variables: SqlPolicyGenerateVariables) => void
  onError?: (error: ResponseError, variables: SqlPolicyGenerateVariables) => void
} = {}) => {
  return useMutation<SqlPolicyGenerateResponse, ResponseError, SqlPolicyGenerateVariables>(
    (vars) => generateSqlPolicy(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to generate policy: ${data.message}`)
        } else {
          onError(data, variables)
        }
      },
      ...options,
    }
  )
}
