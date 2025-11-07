import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggerDeleteVariables = {
  trigger: {
    id: number
    name: string
    schema: string
    table: string
  }
  projectRef: string
  connectionString?: string | null
}

export async function deleteDatabaseTrigger({
  trigger,
  projectRef,
  connectionString,
}: DatabaseTriggerDeleteVariables) {
  const { sql } = pgMeta.triggers.remove(trigger)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['trigger', 'delete', trigger.id],
  })

  return result
}

type DatabaseTriggerDeleteData = Awaited<ReturnType<typeof deleteDatabaseTrigger>>

export const useDatabaseTriggerDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseTriggerDeleteData,
    ResponseError,
    DatabaseTriggerDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerDeleteData, ResponseError, DatabaseTriggerDeleteVariables>({
    mutationFn: (vars) => deleteDatabaseTrigger(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseTriggerKeys.list(projectRef) })
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
  })
}
