import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import pgMeta from '@supabase/pg-meta'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { PGTriggerUpdate } from '@supabase/pg-meta/src/pg-meta-triggers'

export type DatabaseTriggerUpdateVariables = {
  originalTrigger: {
    id: number
    name: string
    schema: string
    table: string
  }
  projectRef: string
  connectionString?: string | null
  payload: PGTriggerUpdate
}

export async function updateDatabaseTrigger({
  originalTrigger,
  projectRef,
  connectionString,
  payload,
}: DatabaseTriggerUpdateVariables) {
  const { sql } = pgMeta.triggers.update(originalTrigger, payload)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['trigger', 'update', originalTrigger.id],
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
