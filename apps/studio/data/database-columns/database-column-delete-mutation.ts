import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { del, handleError } from 'data/fetchers'
import { tableEditorKeys } from 'data/table-editor/keys'
import { tableRowKeys } from 'data/table-rows/keys'
import { viewKeys } from 'data/views/keys'
import type { ResponseError } from 'types'

export type DatabaseColumnDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: string
  cascade?: boolean
  table?: { id: number; schema: string; name: string }
}

export async function deleteDatabaseColumn({
  projectRef,
  connectionString,
  id,
  cascade = false,
}: DatabaseColumnDeleteVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/columns', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      // cascade is expected to be a string 'true' or 'false'
      query: { id, cascade: cascade.toString() },
    },
    headers,
  })

  if (error) handleError(error)
  return data
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
        const { projectRef, table } = variables
        await Promise.all([
          // refetch all entities in the sidebar because deleting a column may regenerate a view (and change its id)
          queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
          ...(table !== undefined
            ? [
                queryClient.invalidateQueries(
                  databaseKeys.foreignKeyConstraints(projectRef, table?.schema)
                ),
                queryClient.invalidateQueries(tableEditorKeys.tableEditor(projectRef, table.id)),
                queryClient.invalidateQueries(databaseKeys.tableDefinition(projectRef, table.id)),
                // invalidate all views from this schema, not sure if this is needed since you can't actually delete a column
                // which has a view dependent on it
                queryClient.invalidateQueries(viewKeys.listBySchema(projectRef, table.schema)),
              ]
            : []),
        ])

        if (table !== undefined) {
          // We need to invalidate tableRowsAndCount after tableEditor
          // to ensure the query sent is correct
          await queryClient.invalidateQueries(tableRowKeys.tableRowsAndCount(projectRef, table.id))
        }

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
