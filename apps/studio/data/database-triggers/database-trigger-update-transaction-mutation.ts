import { getDatabaseTriggerUpdateSQL, type SafeSqlFragment } from '@supabase/pg-meta'
import { PGTrigger, PGTriggerCreate } from '@supabase/pg-meta/src/pg-meta-triggers'
import { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseTriggerKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

// [Joshen] Writing this query within FE as the PATCH endpoint from pg-meta only supports updating
// trigger name and enabled mode. So we'll delete and create the trigger, within a single transaction
// Copying the SQL from https://github.com/supabase/postgres-meta/blob/master/src/lib/PostgresMetaTriggers.ts

export type DatabaseTriggerUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  originalTrigger: PostgresTrigger
  updatedTrigger: Omit<PGTriggerCreate, 'events'> &
    Pick<PGTrigger, 'enabled_mode'> & { events: Array<SafeSqlFragment> }
}

export async function updateDatabaseTrigger({
  projectRef,
  connectionString,
  originalTrigger,
  updatedTrigger,
}: DatabaseTriggerUpdateVariables) {
  const sql = getDatabaseTriggerUpdateSQL({ originalTrigger, updatedTrigger })
  await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['trigger', 'update', originalTrigger.id],
  })
  return updatedTrigger
}

type DatabaseTriggerUpdateTxnData = Awaited<ReturnType<typeof updateDatabaseTrigger>>

export const useDatabaseTriggerUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseTriggerUpdateTxnData,
    ResponseError,
    DatabaseTriggerUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerUpdateTxnData, ResponseError, DatabaseTriggerUpdateVariables>({
    mutationFn: (vars) => updateDatabaseTrigger(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseTriggerKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update database trigger: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
