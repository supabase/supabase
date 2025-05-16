import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseIndexesKeys } from './keys'
import { applyAndTrackMigrations } from 'data/sql/utils/migrations'

export type DatabaseIndexDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  name: string
}

export async function deleteDatabaseIndex({
  projectRef,
  connectionString,
  name,
}: DatabaseIndexDeleteVariables) {
  const { sql } = pgMeta.indexes.remove(name)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: applyAndTrackMigrations(sql, `delete_index_${name}`),
    queryKey: ['indexes'],
  })

  return result
}

type DatabaseIndexDeleteData = Awaited<ReturnType<typeof deleteDatabaseIndex>>

export const useDatabaseIndexDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseIndexDeleteData, ResponseError, DatabaseIndexDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseIndexDeleteData, ResponseError, DatabaseIndexDeleteVariables>(
    (vars) => deleteDatabaseIndex(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseIndexesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database index: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
