import { getAbortQuerySQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sqlKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type SessionTerminateVariables = {
  pid: number
  projectRef?: string
  connectionString?: string | null
}

export async function terminateSession({
  pid,
  projectRef,
  connectionString,
}: SessionTerminateVariables) {
  const sql = getAbortQuerySQL({ pid })
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['terminate-session'],
  })
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
        toast.error(`Failed to abort query: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
