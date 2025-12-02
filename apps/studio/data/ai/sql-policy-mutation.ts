import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { CreatePolicyBody } from 'data/database-policies/database-policy-create-mutation'
import { fetchPost } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
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

/**
 * AI-generated policy response extends CreatePolicyBody with required fields and sql for display.
 */
export type SqlPolicyGenerateResponse = (Required<
  Pick<CreatePolicyBody, 'name' | 'table' | 'schema' | 'action' | 'roles'>
> &
  Pick<CreatePolicyBody, 'command' | 'definition' | 'check'> & {
    sql: string
  })[]

export async function generateSqlPolicy({
  tableName,
  schema,
  columns,
  projectRef,
  connectionString,
  orgSlug,
  message,
}: SqlPolicyGenerateVariables): Promise<SqlPolicyGenerateResponse> {
  const result = await fetchPost<SqlPolicyGenerateResponse>(`${BASE_PATH}/api/ai/sql/policy`, {
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
