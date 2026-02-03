import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import pgMeta from '@supabase/pg-meta'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import type { DatabaseFunction } from './database-functions-query'

export type DatabaseFunctionUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  func: DatabaseFunction
  payload: z.infer<typeof pgMeta.functions.pgFunctionCreateZod>
}

export async function updateDatabaseFunction({
  projectRef,
  connectionString,
  func,
  payload,
}: DatabaseFunctionUpdateVariables) {
  const { sql, zod } = pgMeta.functions.update(func, payload)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['functions', 'update', func.id.toString()],
  })

  return result as z.infer<typeof zod>
}

type DatabaseFunctionUpdateData = Awaited<ReturnType<typeof updateDatabaseFunction>>

export const useDatabaseFunctionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseFunctionUpdateData,
    ResponseError,
    DatabaseFunctionUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>({
    mutationFn: (vars) => updateDatabaseFunction(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseKeys.databaseFunctions(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update database function: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
