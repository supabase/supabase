import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import pgMeta from '@supabase/pg-meta'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'

export type DatabaseTriggerUpdateVariables = {
  id: number
  projectRef: string
  connectionString?: string | null
  payload: {
    name?: string
    enabled_mode?: 'ORIGIN' | 'REPLICA' | 'ALWAYS' | 'DISABLED'
  }
}

export async function updateDatabaseTrigger({
  id,
  projectRef,
  connectionString,
  payload,
}: DatabaseTriggerUpdateVariables) {
  const { sql } = pgMeta.triggers.update({ id }, payload)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['trigger', 'update'],
  })

  return result
}

type DatabaseTriggerUpdateData = Awaited<ReturnType<typeof updateDatabaseTrigger>>

export const useDatabaseTriggerUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerUpdateData, ResponseError, DatabaseTriggerUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerUpdateData, ResponseError, DatabaseTriggerUpdateVariables>(
    (vars) => updateDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database trigger: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
