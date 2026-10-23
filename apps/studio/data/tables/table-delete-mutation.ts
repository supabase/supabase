import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from '@/data/sql/execute-sql-mutation'
import { invalidateTableMetadata } from '@/data/tables/table-metadata-invalidation'
import { viewKeys } from '@/data/views/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

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
  UseCustomMutationOptions<TableDeleteData, ResponseError, TableDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableDeleteData, ResponseError, TableDeleteVariables>({
    mutationFn: (vars) => deleteTable(vars),
    async onSuccess(data, variables, context) {
      const { id, projectRef, schema, name } = variables
      await Promise.all([
        invalidateTableMetadata(queryClient, {
          projectRef,
          schema,
          tableId: id,
          tableName: name,
          includeLint: true,
        }),
        // invalidate all views from this schema
        queryClient.invalidateQueries({ queryKey: viewKeys.listBySchema(projectRef, [schema]) }),
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
  })
}
