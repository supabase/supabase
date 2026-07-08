import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchPost } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError, UseCustomMutationOptions } from '@/types'

export type SqlPolicyGenerateVariables = {
  tableName: string
  schema?: string
  columns?: string[]
  projectRef: string
  connectionString: string
  orgSlug?: string
  message?: string
}

type RawSqlPolicy = {
  name: string
  table: string
  schema: string
  action: 'PERMISSIVE' | 'RESTRICTIVE'
  roles: string[]
  command?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  definition?: string
  check?: string
  sql: string
}

/**
 * AI-generated policy. `definition` and `check` are branded `UntrustedSqlFragment` at the
 * boundary — they originate from third-party AI output and must be promoted via
 * `acceptUntrustedSql` at a user gesture before executing.
 */
export type SqlPolicyGenerateResponse = Array<
  Omit<RawSqlPolicy, 'definition' | 'check'> & {
    definition?: UntrustedSqlFragment
    check?: UntrustedSqlFragment
  }
>

export async function generateSqlPolicy({
  tableName,
  schema,
  columns,
  projectRef,
  connectionString,
  orgSlug,
  message,
}: SqlPolicyGenerateVariables): Promise<SqlPolicyGenerateResponse> {
  const result = await fetchPost<Array<RawSqlPolicy>>(`${BASE_PATH}/api/ai/sql/policy`, {
    tableName,
    schema,
    columns,
    projectRef,
    connectionString,
    orgSlug,
    message,
  })

  if ('error' in result) throw new ResponseError((result.error as any).message, 400)
  return (result as Array<RawSqlPolicy>).map((policy) => ({
    ...policy,
    definition: policy.definition === undefined ? undefined : untrustedSql(policy.definition),
    check: policy.check === undefined ? undefined : untrustedSql(policy.check),
  }))
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
