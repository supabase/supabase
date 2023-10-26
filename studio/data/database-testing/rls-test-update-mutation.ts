import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import {
  SUPABASE_TEST_HELPERS_CLEAR_AUTH,
  SUPABASE_TEST_HELPERS_CREATE_TEST_USER,
  SUPABASE_TEST_HELPERS_SQL_WRAPPER,
} from './database-testing.constants'

export type RLSTestUpdateVariables = {
  projectRef?: string
  connectionString?: string
  type: 'authenticated' | 'anonymous'
  data: { schema: string; table: string; column: string; value: string }
}

export function getRLSTestUpdateSql(
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

${type === 'authenticated' ? SUPABASE_TEST_HELPERS_CREATE_TEST_USER : ''}

${
  type === 'anonymous'
    ? ``
    : `insert into "${schema}"."${table}" ("${column}") values ('${value}') `
}

${type === 'anonymous' ? SUPABASE_TEST_HELPERS_CLEAR_AUTH : ''}

select
    is_empty(
            $$ update "${schema}"."${table}" set "${column}" = '${value}' returning "${column}" $$,
            'anon users cannot update posts'
        );
  `.trim()
  )
}

export async function runRLSTestUpdate({
  projectRef,
  connectionString,
  data,
  type = 'anonymous',
}: RLSTestUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('Connection string is required')

  const sql = getRLSTestUpdateSql(type, data)
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['rls-test-insert'],
  })
  return result[0]
}

type RLSTestData = Awaited<ReturnType<typeof runRLSTestUpdate>>

export const useRLSTestUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<RLSTestData, ResponseError, RLSTestUpdateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<RLSTestData, ResponseError, RLSTestUpdateVariables>(
    (vars) => runRLSTestUpdate(vars),
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
