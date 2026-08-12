import { getCancelQuerySQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sqlKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type QueryCancelVariables = {
  pid: number
  projectRef?: string
  connectionString?: string | null
}

async function cancelQuery({ pid, projectRef, connectionString }: QueryCancelVariables) {
  const sql = getCancelQuerySQL({ pid })
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['cancel-query'],
  })
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
