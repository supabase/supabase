import { getTablesRlsEnabledStatusSQL } from '@supabase/pg-meta'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from '../sql/execute-sql-query'
import { ResponseError, UseCustomMutationOptions } from '@/types'

type CheckTableRLSStatusVariables = {
  projectRef?: string
  connectionString?: string | null
  tables: { schema: string; table: string }[]
}

export type CheckTableRLSStatusResponse = {
  schema: string
  table: string
  rls_enabled: boolean
}

export async function checkTableRLSStatus({
  projectRef,
  connectionString,
  tables,
}: CheckTableRLSStatusVariables) {
  const sql = getTablesRlsEnabledStatusSQL({ tables })
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['table-rls-status'],
  })
  return result as CheckTableRLSStatusResponse[]
}

type CheckTableRLSStatusData = Awaited<ReturnType<typeof checkTableRLSStatus>>

export const useCheckTableRLSStatusMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CheckTableRLSStatusData, ResponseError, CheckTableRLSStatusVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<CheckTableRLSStatusData, ResponseError, CheckTableRLSStatusVariables>({
    mutationFn: (vars) => checkTableRLSStatus(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to retrieve table RLS statuses: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
