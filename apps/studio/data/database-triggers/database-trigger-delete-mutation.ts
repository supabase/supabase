import pgMeta, { asWriteSql } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseTriggerKeys } from './keys'
import { executeSql, type PgMetaWriteGrant } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type DatabaseTriggerDeleteVariables = {
  trigger: {
    id: number
    name: string
    schema: string
    table: string
  }
  projectRef: string
  grant: PgMetaWriteGrant
  connectionString?: string | null
}

export async function deleteDatabaseTrigger({
  trigger,
  projectRef,
  grant,
  connectionString,
}: DatabaseTriggerDeleteVariables) {
  const { sql } = pgMeta.triggers.remove(trigger)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sqlOrigin: 'studio',
    queryName: 'trigger-delete',
    sql: asWriteSql(sql),
    queryKey: ['trigger', 'delete', trigger.id],
    grant,
  })

  return result
}

type DatabaseTriggerDeleteData = Awaited<ReturnType<typeof deleteDatabaseTrigger>>

export const useDatabaseTriggerDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DatabaseTriggerDeleteData, StudioError, DatabaseTriggerDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerDeleteData, StudioError, DatabaseTriggerDeleteVariables>({
    mutationFn: (vars) => deleteDatabaseTrigger(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseTriggerKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete database trigger: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
