import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { entityTypeKeys } from 'data/entity-types/keys'
import { del, handleError } from 'data/fetchers'
import { sqlKeys } from 'data/sql/keys'
import { tableKeys } from 'data/tables/keys'
import { viewKeys } from 'data/views/keys'
import type { TableLike } from 'hooks/misc/useTable'
import type { ResponseError } from 'types'

export type DatabaseColumnDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: string
  cascade?: boolean
  table?: TableLike
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
          queryClient.invalidateQueries(sqlKeys.query(projectRef, ['foreign-key-constraints'])),
          // refetch all entities in the sidebar because deleting a column may regenerate a view (and change its id)
          queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
          ...(table !== undefined
            ? [
                queryClient.invalidateQueries(tableKeys.table(projectRef, table.id)),
                queryClient.invalidateQueries(
                  sqlKeys.query(projectRef, [table.schema, table.name])
                ),
                queryClient.invalidateQueries(
                  sqlKeys.query(projectRef, ['table-definition', table.schema, table.name])
                ),
                // invalidate all views from this schema, not sure if this is needed since you can't actually delete a column
                // which has a view dependent on it
                queryClient.invalidateQueries(viewKeys.listBySchema(projectRef, table.schema)),
                // invalidate the view if there's a view with this id, not sure if this is needed because you can't delete a
                // column from a view
                queryClient.invalidateQueries(viewKeys.view(projectRef, table.id)),
              ]
            : []),
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
    }
  )
}
