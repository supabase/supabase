import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import type { DatabaseEventTrigger } from './database-event-triggers-query'
import { databaseEventTriggerKeys } from './keys'

const escapeIdentifier = (value: string) => value.replace(/"/g, '""')

export type DatabaseEventTriggerDeleteVariables = {
  trigger: DatabaseEventTrigger
  projectRef: string
  connectionString?: string | null
}

export async function deleteDatabaseEventTrigger({
  trigger,
  projectRef,
  connectionString,
}: DatabaseEventTriggerDeleteVariables) {
  const sql = `DROP EVENT TRIGGER IF EXISTS "${escapeIdentifier(trigger.name)}";`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['event-trigger', 'delete', trigger.oid],
  })

  return result
}

type DatabaseEventTriggerDeleteData = Awaited<ReturnType<typeof deleteDatabaseEventTrigger>>

export const useDatabaseEventTriggerDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseEventTriggerDeleteData,
    ResponseError,
    DatabaseEventTriggerDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseEventTriggerDeleteData,
    ResponseError,
    DatabaseEventTriggerDeleteVariables
  >({
    mutationFn: (vars) => deleteDatabaseEventTrigger(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: databaseEventTriggerKeys.list(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete event trigger: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
