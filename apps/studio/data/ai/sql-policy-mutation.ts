import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { CreatePolicyBody } from 'data/database-policies/database-policy-create-mutation'
import { fetchPost } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError, UseCustomMutationOptions } from 'types'

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

  if ('error' in result) throw new ResponseError((result.error as any).message, 400)
  return result as SqlPolicyGenerateResponse
}

type SqlPolicyGenerateData = Awaited<ReturnType<typeof generateSqlPolicy>>

export const useSqlPolicyGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SqlPolicyGenerateData, ResponseError, SqlPolicyGenerateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SqlPolicyGenerateResponse, ResponseError, SqlPolicyGenerateVariables>({
    mutationFn: (vars) => generateSqlPolicy(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate policy: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
