import pgMeta, { asWriteSql } from '@supabase/pg-meta'
import type { PGFunctionUpdate } from '@supabase/pg-meta/src/pg-meta-functions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import type { SavedDatabaseFunction } from './database-functions-query'
import { databaseKeys } from '@/data/database/keys'
import type { SqlOrigin } from '@/data/error-classification'
import { executeSql, type PgMetaWriteGrant } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type DatabaseFunctionUpdateVariables = {
  projectRef: string
  grant: PgMetaWriteGrant
  connectionString?: string | null
  func: SavedDatabaseFunction
  payload: PGFunctionUpdate
  sqlOrigin: SqlOrigin
}

export async function updateDatabaseFunction({
  projectRef,
  grant,
  connectionString,
  func,
  payload,
  sqlOrigin,
}: DatabaseFunctionUpdateVariables) {
  const { sql, zod } = pgMeta.functions.update(func, payload)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: asWriteSql(sql),
    sqlOrigin,
    queryName: 'database-function-update',
    queryKey: ['functions', 'update', func.id.toString()],
    grant,
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
    StudioError,
    DatabaseFunctionUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionUpdateData, StudioError, DatabaseFunctionUpdateVariables>({
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
