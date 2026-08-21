import { getCancelQuerySQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sqlKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, type UseCustomMutationOptions } from '@/types'

type QueryCancelVariables = {
  pid: number
  /** Pass the pid's last-known backend_start to guard against a reused pid matching an unrelated session */
  backendStart?: string
  projectRef?: string
  connectionString?: string | null
}

async function cancelQuery({
  pid,
  backendStart,
  projectRef,
  connectionString,
}: QueryCancelVariables) {
  const sql = getCancelQuerySQL({ pid, backendStart })
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['cancel-query'],
  })
  if (backendStart !== undefined && result.length === 0) {
    throw new ResponseError(
      `Session (PID: ${pid}) has already changed since this list was loaded. Refresh and try again.`
    )
  }
  return result
}

type QueryCancelData = Awaited<ReturnType<typeof cancelQuery>>

export const useQueryCancelMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<QueryCancelData, ResponseError, QueryCancelVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<QueryCancelData, ResponseError, QueryCancelVariables>({
    mutationFn: (vars) => cancelQuery(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: sqlKeys.ongoingQueries(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to cancel query: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
