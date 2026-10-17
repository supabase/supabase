import pgMeta from '@supabase/pg-meta'
import { PGColumn } from '@supabase/pg-meta/src/pg-meta-columns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from '@/data/sql/execute-sql-mutation'
import { invalidateTableMetadata } from '@/data/tables/table-metadata-invalidation'
import { viewKeys } from '@/data/views/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DatabaseColumnDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  column: Pick<PGColumn, 'id' | 'name' | 'schema' | 'table' | 'table_id'>
  cascade?: boolean
}

export async function deleteDatabaseColumn({
  projectRef,
  connectionString,
  column,
  cascade = false,
}: DatabaseColumnDeleteVariables) {
  const { sql } = pgMeta.columns.remove(column, { cascade })

  const { result } = await executeSql<void>({
    projectRef,
    connectionString,
    sql,
    queryKey: ['column', 'delete', column.id],
  })

  return result
}

type DatabaseColumnDeleteData = Awaited<ReturnType<typeof deleteDatabaseColumn>>

export const useDatabaseColumnDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DatabaseColumnDeleteData, ResponseError, DatabaseColumnDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DatabaseColumnDeleteData, ResponseError, DatabaseColumnDeleteVariables>({
    mutationFn: (vars) => deleteDatabaseColumn(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, column } = variables
      await Promise.all([
        // refetch all entities in the sidebar because deleting a column may regenerate a view (and change its id)
        invalidateTableMetadata(queryClient, {
          projectRef,
          schema: column.schema,
          tableId: column.table_id,
          tableName: column.table,
          includeRows: true,
          includeLint: true,
        }),
        // invalidate all views from this schema, not sure if this is needed since you can't actually delete a column
        // which has a view dependent on it
        queryClient.invalidateQueries({
          queryKey: viewKeys.listBySchema(projectRef, [column.schema]),
        }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete database column: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
