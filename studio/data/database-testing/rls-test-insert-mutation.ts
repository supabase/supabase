import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import {
  SUPABASE_TEST_HELPERS_CLEAR_AUTH,
  SUPABASE_TEST_HELPERS_CREATE_TEST_USER,
  SUPABASE_TEST_HELPERS_SQL_WRAPPER,
} from './database-testing.constants'
import { inferTestResult } from './database-testing.utils'

export type RLSTestInsertVariables = {
  projectRef?: string
  connectionString?: string
  type: 'authenticated' | 'anonymous'
  data: { schema: string; table: string; column: string; value: string }
}

export function getRLSTestInsertSql(
  type: 'authenticated' | 'anonymous',
  {
    schema,
    table,
    column,
    value,
  }: {
    schema: string
    table: string
    column: string
    value: string
  }
) {
  return SUPABASE_TEST_HELPERS_SQL_WRAPPER(
    /* SQL */ `
select plan(1);

${type === 'anonymous' ? SUPABASE_TEST_HELPERS_CLEAR_AUTH : SUPABASE_TEST_HELPERS_CREATE_TEST_USER}
select
    throws_ok(
            $$ insert into "${schema}"."${table}" ("${column}") values ('${value}') $$,
            'new row violates row-level security policy for table "${table}"'
        );
  `.trim()
  )
}

export async function runRLSTestInsert({
  projectRef,
  connectionString,
  data,
  type = 'anonymous',
}: RLSTestInsertVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('Connection string is required')

  const sql = getRLSTestInsertSql(type, data)
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['rls-test-insert'],
  })
  return inferTestResult(result[0])
}

type RLSTestData = Awaited<ReturnType<typeof runRLSTestInsert>>

export const useRLSTestInsertMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<RLSTestData, ResponseError, RLSTestInsertVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<RLSTestData, ResponseError, RLSTestInsertVariables>(
    (vars) => runRLSTestInsert(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to run test: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
