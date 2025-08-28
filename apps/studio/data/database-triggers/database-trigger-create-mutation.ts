import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import pgMeta from '@supabase/pg-meta'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { PGTriggerCreate } from '@supabase/pg-meta/src/pg-meta-triggers'

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
  UseMutationOptions<DatabaseTriggerCreateData, ResponseError, DatabaseTriggerCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerCreateData, ResponseError, DatabaseTriggerCreateVariables>(
    (vars) => createDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
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
    }
  )
}
