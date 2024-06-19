import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { executeSql } from 'data/sql/execute-sql-query'
import { quoteLiteral } from 'lib/pg-format'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'

// [Joshen] Writing this query within FE as the PATCH endpoint from pg-meta only supports updating
// trigger name and enabled mode. So we'll delete and create the trigger, within a single transaction
// Copying the SQL from https://github.com/supabase/postgres-meta/blob/master/src/lib/PostgresMetaTriggers.ts

export type DatabaseTriggerUpdateVariables = {
  projectRef: string
  connectionString?: string
  originalTrigger: any
  updatedTrigger: any
}

export function getDatabaseTriggerUpdateSQL({
  originalTrigger,
  updatedTrigger,
}: Pick<DatabaseTriggerUpdateVariables, 'originalTrigger' | 'updatedTrigger'>) {
  const { name, activation, events, schema, table, function_schema, function_name, function_args } =
    updatedTrigger
  return /* SQL */ `
BEGIN;
DROP TRIGGER "${originalTrigger.name}" ON "${originalTrigger.schema}"."${originalTrigger.table}";
CREATE TRIGGER "${name}" ${activation} ${events.join(' OR ')} ON "${schema}"."${table}" 
  FOR EACH ROW EXECUTE FUNCTION 
  "${function_schema}"."${function_name}"(${function_args?.map(quoteLiteral).join(',') ?? ''});
COMMIT;
`.trim()
}

export async function updateDatabaseTrigger({
  projectRef,
  connectionString,
  originalTrigger,
  updatedTrigger,
}: DatabaseTriggerUpdateVariables) {
  const sql = getDatabaseTriggerUpdateSQL({ originalTrigger, updatedTrigger })
  await executeSql({ projectRef, connectionString, sql })
  return updatedTrigger
}

type DatabaseTriggerUpdateTxnData = Awaited<ReturnType<typeof updateDatabaseTrigger>>

export const useDatabaseTriggerUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerUpdateTxnData, ResponseError, DatabaseTriggerUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerUpdateTxnData, ResponseError, DatabaseTriggerUpdateVariables>(
    (vars) => updateDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
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
    }
  )
}
