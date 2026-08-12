import { getTerminateSessionSQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sqlKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, type UseCustomMutationOptions } from '@/types'

type SessionTerminateVariables = {
  pid: number
  /** Pass the pid's last-known backend_start to guard against a reused pid matching an unrelated session */
  backendStart?: string
  projectRef?: string
  connectionString?: string | null
}

export async function terminateSession({
  pid,
  backendStart,
  projectRef,
  connectionString,
}: SessionTerminateVariables) {
  const sql = getTerminateSessionSQL({ pid, backendStart })
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['terminate-session'],
  })
  if (backendStart !== undefined && result.length === 0) {
    throw new ResponseError(
      `Session (PID: ${pid}) has already changed since this list was loaded. Refresh and try again.`
    )
  }
  return result
}

type QueryAbortData = Awaited<ReturnType<typeof terminateSession>>

export const useSessionTerminateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<QueryAbortData, ResponseError, SessionTerminateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<QueryAbortData, ResponseError, SessionTerminateVariables>({
    mutationFn: (vars) => terminateSession(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: sqlKeys.ongoingQueries(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to terminate session: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
