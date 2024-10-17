import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import pgMeta from '@supabase/pg-meta'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import type { ResponseError } from 'types'
import type { DatabaseFunction } from './database-functions-query'

export type DatabaseFunctionUpdateVariables = {
  projectRef: string
  connectionString?: string
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
  UseMutationOptions<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>(
    (vars) => updateDatabaseFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, ['functions-list']))
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
    }
  )
}
