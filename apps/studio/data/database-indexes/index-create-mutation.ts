import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseIndexesKeys } from './keys'
import { applyAndTrackMigrations } from 'data/sql/utils/migrations'

export type DatabaseIndexCreateVariables = {
  projectRef: string
  connectionString?: string | null
  payload: {
    schema: string
    entity: string
    type: string
    columns: string[]
  }
}

export async function createDatabaseIndex({
  projectRef,
  connectionString,
  payload,
}: DatabaseIndexCreateVariables) {
  const { sql } = pgMeta.indexes.create(payload)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: applyAndTrackMigrations(sql, `create_index_${payload.entity}`),
    queryKey: ['indexes', 'create'],
  })

  return result
}

type DatabaseIndexCreateData = Awaited<ReturnType<typeof createDatabaseIndex>>

export const useDatabaseIndexCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseIndexCreateData, ResponseError, DatabaseIndexCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseIndexCreateData, ResponseError, DatabaseIndexCreateVariables>(
    (vars) => createDatabaseIndex(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseIndexesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database index: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
