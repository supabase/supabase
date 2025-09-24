import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'
import { executeSql } from 'data/sql/execute-sql-query'
import { buildExplainSqlForQuery } from 'data/sql/execute-sql-mutation'

export type SqlExplainAnalyzeResponse = string

export type SqlExplainAnalyzeVariables = {
  plan: string
  query?: string
}

export async function analyzeSqlExplain({ plan, query }: SqlExplainAnalyzeVariables) {
  const url = `${BASE_PATH}/api/ai/sql/explain`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ plan, query }),
  })

  let body: any

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ResponseError(
      body?.message || body?.error || 'Failed to analyze query',
      response.status
    )
  }

  return body as SqlExplainAnalyzeResponse
}

type SqlExplainAnalyzeData = Awaited<ReturnType<typeof analyzeSqlExplain>>

// Convenience mutation: takes a raw SQL statement and connection context, builds and fetches the EXPLAIN plan,
// then calls the AI analysis endpoint. This ensures isLoading starts immediately upon mutate.
export type SqlExplainAnalyzeFromQueryVariables = {
  projectRef?: string
  connectionString?: string
  sql: string
}

async function analyzeSqlExplainFromQuery({
  projectRef,
  connectionString,
  sql,
}: SqlExplainAnalyzeFromQueryVariables) {
  // Build EXPLAIN SQL
  const explainSql = buildExplainSqlForQuery(sql)
  // Execute EXPLAIN
  const exec = await executeSql<any[]>({
    projectRef,
    connectionString,
    sql: explainSql,
  })
  const plan = JSON.stringify(exec.result)
  // Call AI analysis
  return await analyzeSqlExplain({ plan, query: sql })
}

type SqlExplainAnalyzeFromQueryData = Awaited<ReturnType<typeof analyzeSqlExplainFromQuery>>

export const useSqlExplainAnalyzeFromQueryMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    SqlExplainAnalyzeFromQueryData,
    ResponseError,
    SqlExplainAnalyzeFromQueryVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    SqlExplainAnalyzeFromQueryData,
    ResponseError,
    SqlExplainAnalyzeFromQueryVariables
  >((vars) => analyzeSqlExplainFromQuery(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to analyze query: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
