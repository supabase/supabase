import type { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import pgMeta from '@supabase/pg-meta'
import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'

export type DatabaseTriggerDeleteVariables = {
  id: number
  projectRef: string
  connectionString?: string | null
}

type DeleteDatabaseTriggerResponse = PostgresTrigger & { error?: any }

export async function deleteDatabaseTrigger({
  id,
  projectRef,
  connectionString,
}: DatabaseTriggerDeleteVariables) {
  const { sql } = pgMeta.triggers.remove({ id })

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['trigger', 'delete'],
  })

  return result
}

type DatabaseTriggerDeleteData = Awaited<ReturnType<typeof deleteDatabaseTrigger>>

export const useDatabaseTriggerDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerDeleteData, ResponseError, DatabaseTriggerDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerDeleteData, ResponseError, DatabaseTriggerDeleteVariables>(
    (vars) => deleteDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database trigger: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
