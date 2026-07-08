import { ident, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { materializedViewKeys } from './keys'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { tableEditorKeys } from '@/data/table-editor/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type MaterializedViewDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  id: number
  name: string
  schema: string
  cascade?: boolean
}

export async function deleteMaterializedView({
  projectRef,
  connectionString,
  id,
  name,
  schema,
  cascade = false,
}: MaterializedViewDeleteVariables) {
  const sql = safeSql`DROP MATERIALIZED VIEW ${ident(schema)}.${ident(name)}${cascade ? safeSql` CASCADE` : safeSql``};`

  const { result } = await executeSql<void>({
    projectRef,
    connectionString,
    sql,
    queryKey: ['materialized-view', 'delete', id],
  })

  return result
}

type MaterializedViewDeleteData = Awaited<ReturnType<typeof deleteMaterializedView>>

export const useMaterializedViewDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    MaterializedViewDeleteData,
    ResponseError,
    MaterializedViewDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<MaterializedViewDeleteData, ResponseError, MaterializedViewDeleteVariables>({
    mutationFn: (vars) => deleteMaterializedView(vars),
    async onSuccess(data, variables, context) {
      const { id, projectRef, schema } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tableEditorKeys.tableEditor(projectRef, id) }),
        queryClient.invalidateQueries({
          queryKey: materializedViewKeys.listBySchema(projectRef, schema),
        }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete materialized view: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
