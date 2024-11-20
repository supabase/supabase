import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import pgMeta from '@supabase/pg-meta'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { DatabaseFunction } from './database-functions-query'

export type DatabaseFunctionDeleteVariables = {
  projectRef: string
  connectionString?: string
  func: DatabaseFunction
}

export async function deleteDatabaseFunction({
  projectRef,
  connectionString,
  func,
}: DatabaseFunctionDeleteVariables) {
  const { sql, zod } = pgMeta.functions.remove(func)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['functions', 'delete', func.id.toString()],
  })

  return result as z.infer<typeof zod>
}

type DatabaseFunctionDeleteData = Awaited<ReturnType<typeof deleteDatabaseFunction>>

export const useDatabaseFunctionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionDeleteData, ResponseError, DatabaseFunctionDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionDeleteData, ResponseError, DatabaseFunctionDeleteVariables>(
    (vars) => deleteDatabaseFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseKeys.databaseFunctions(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
