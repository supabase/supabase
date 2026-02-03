import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseEventTriggerKeys } from './keys'

export type DatabaseEventTriggerCreateVariables = {
  projectRef: string
  connectionString?: string | null
  sql: string
}

export async function createDatabaseEventTrigger({
  projectRef,
  connectionString,
  sql,
}: DatabaseEventTriggerCreateVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['event-trigger', 'create'],
  })

  return result
}

type DatabaseEventTriggerCreateData = Awaited<ReturnType<typeof createDatabaseEventTrigger>>

export const useDatabaseEventTriggerCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseEventTriggerCreateData,
    ResponseError,
    DatabaseEventTriggerCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseEventTriggerCreateData,
    ResponseError,
    DatabaseEventTriggerCreateVariables
  >({
    mutationFn: (vars) => createDatabaseEventTrigger(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseEventTriggerKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create event trigger: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
