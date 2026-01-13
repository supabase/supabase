import pgMeta from '@supabase/pg-meta'
import { PGTriggerCreate } from '@supabase/pg-meta/src/pg-meta-triggers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggerCreateVariables = {
  projectRef: string
  connectionString?: string | null
  payload: PGTriggerCreate
}

export async function createDatabaseTrigger({
  projectRef,
  connectionString,
  payload,
}: DatabaseTriggerCreateVariables) {
  const { sql } = pgMeta.triggers.create(payload)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['trigger', 'create'],
  })

  return result
}

type DatabaseTriggerCreateData = Awaited<ReturnType<typeof createDatabaseTrigger>>

export const useDatabaseTriggerCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseTriggerCreateData,
    ResponseError,
    DatabaseTriggerCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerCreateData, ResponseError, DatabaseTriggerCreateVariables>({
    mutationFn: (vars) => createDatabaseTrigger(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseTriggerKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create database trigger: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
