import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { entityTypeKeys } from 'data/entity-types/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { viewKeys } from 'data/views/keys'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'

export type TableDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  id: number
  name: string
  schema: string
  cascade?: boolean
}

export async function deleteTable({
  projectRef,
  connectionString,
  id,
  name,
  schema,
  cascade = false,
}: TableDeleteVariables) {
  const { sql } = pgMeta.tables.remove({ name, schema }, { cascade })

  const { result } = await executeSql<void>({
    projectRef,
    connectionString,
    sql,
    queryKey: ['table', 'delete', id],
  })

  return result
}

type TableDeleteData = Awaited<ReturnType<typeof deleteTable>>

export const useTableDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableDeleteData, ResponseError, TableDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableDeleteData, ResponseError, TableDeleteVariables>(
    (vars) => deleteTable(vars),
    {
      async onSuccess(data, variables, context) {
        const { id, projectRef, schema } = variables
        await Promise.all([
          queryClient.invalidateQueries(tableEditorKeys.tableEditor(projectRef, id)),
          queryClient.invalidateQueries(tableKeys.list(projectRef, schema)),
          queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
          // invalidate all views from this schema
          queryClient.invalidateQueries(viewKeys.listBySchema(projectRef, schema)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
