import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { post, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { PostgresPolicy } from '@supabase/postgres-meta'

export interface RLSSimulationContext {
  role: string
  jwtClaims?: Record<string, any>
  userId?: string
}

export interface RLSPolicyEvaluation {
  policy_id: number
  policy_name: string
  command: string
  action: string
  passed: boolean
  expression: string | null
  check_expression: string | null
}

export interface RLSRowResult {
  row_data: Record<string, any>
  row_number: number
  policies_evaluated: RLSPolicyEvaluation[]
  accessible: boolean
}

export interface RLSSimulationResult {
  table_name: string
  schema_name: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  context: RLSSimulationContext
  rls_enabled: boolean
  policies: PostgresPolicy[]
  rows: RLSRowResult[]
  total_rows_without_rls: number
  accessible_rows: number
  error?: string
}

type RLSSimulateVariables = {
  projectRef: string
  connectionString?: string | null
  schema?: string
  table: string
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  context: RLSSimulationContext
  limit?: number
  testData?: Record<string, any>
}

export async function simulateRLS(
  {
    projectRef,
    connectionString,
    schema = 'public',
    table,
    operation = 'SELECT',
    context,
    limit = 100,
    testData,
  }: RLSSimulateVariables,
  headersInit?: HeadersInit
): Promise<RLSSimulationResult> {
  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/rls-playground/simulate' as any, {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    body: {
      schema,
      table,
      operation,
      context,
      limit,
      testData,
    },
    headers,
  })

  if (error) handleError(error)
  return data as RLSSimulationResult
}

type RLSSimulateData = Awaited<ReturnType<typeof simulateRLS>>
type RLSSimulateError = ResponseError

export const useRLSSimulateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<RLSSimulateData, RLSSimulateError, RLSSimulateVariables>, 'mutationFn'> = {}) => {
  return useMutation<RLSSimulateData, RLSSimulateError, RLSSimulateVariables>({
    mutationFn: simulateRLS,
    onSuccess,
    onError,
    ...options,
  })
}
