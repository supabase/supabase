import { ident, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { viewKeys } from './keys'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { tableEditorKeys } from '@/data/table-editor/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ViewDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  id: number
  name: string
  schema: string
  cascade?: boolean
}

export async function deleteView({
  projectRef,
  connectionString,
  id,
  name,
  schema,
  cascade = false,
}: ViewDeleteVariables) {
  const sql = safeSql`DROP VIEW ${ident(schema)}.${ident(name)}${cascade ? safeSql` CASCADE` : safeSql``};`

  const { result } = await executeSql<void>({
    projectRef,
    connectionString,
    sql,
    queryKey: ['view', 'delete', id],
  })

  return result
}

type ViewDeleteData = Awaited<ReturnType<typeof deleteView>>

export const useViewDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ViewDeleteData, ResponseError, ViewDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ViewDeleteData, ResponseError, ViewDeleteVariables>({
    mutationFn: (vars) => deleteView(vars),
    async onSuccess(data, variables, context) {
      const { id, projectRef, schema } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tableEditorKeys.tableEditor(projectRef, id) }),
        queryClient.invalidateQueries({ queryKey: viewKeys.listBySchema(projectRef, [schema]) }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete view: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
