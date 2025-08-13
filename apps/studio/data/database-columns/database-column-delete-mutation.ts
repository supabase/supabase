import pgMeta from '@supabase/pg-meta'
import { PGColumn } from '@supabase/pg-meta/src/pg-meta-columns'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { tableRowKeys } from 'data/table-rows/keys'
import { viewKeys } from 'data/views/keys'
import type { ResponseError } from 'types'

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
  UseMutationOptions<DatabaseColumnDeleteData, ResponseError, DatabaseColumnDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DatabaseColumnDeleteData, ResponseError, DatabaseColumnDeleteVariables>(
    (vars) => deleteDatabaseColumn(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, column } = variables
        await Promise.all([
          // refetch all entities in the sidebar because deleting a column may regenerate a view (and change its id)
          queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
          queryClient.invalidateQueries(
            databaseKeys.foreignKeyConstraints(projectRef, column.schema)
          ),
          queryClient.invalidateQueries(tableEditorKeys.tableEditor(projectRef, column.table_id)),
          queryClient.invalidateQueries(databaseKeys.tableDefinition(projectRef, column.table_id)),
          // invalidate all views from this schema, not sure if this is needed since you can't actually delete a column
          // which has a view dependent on it
          queryClient.invalidateQueries(viewKeys.listBySchema(projectRef, column.schema)),
        ])

        // We need to invalidate tableRowsAndCount after tableEditor
        // to ensure the query sent is correct
        await queryClient.invalidateQueries(
          tableRowKeys.tableRowsAndCount(projectRef, column.table_id)
        )

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
    }
  )
}
