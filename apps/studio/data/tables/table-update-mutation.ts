import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { lintKeys } from 'data/lint/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { tableKeys } from './keys'
import { CreateTableBody } from './table-create-mutation'

export type UpdateTableBody = Partial<CreateTableBody> & {
  id?: number
  rls_enabled?: boolean
  rls_forced?: boolean
  replica_identity?: 'DEFAULT' | 'INDEX' | 'FULL' | 'NOTHING'
  replica_identity_index?: string
}

export type TableUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  id: number
  name: string
  schema: string
  payload: UpdateTableBody
}

export async function updateTable({
  projectRef,
  connectionString,
  id,
  name,
  schema,
  payload,
}: TableUpdateVariables) {
  const { sql } = pgMeta.tables.update({ id, name, schema }, payload)

  const { result } = await executeSql<void>({
    projectRef,
    connectionString,
    sql,
    queryKey: ['table', 'update', id],
  })

  return result
}

type TableUpdateData = Awaited<ReturnType<typeof updateTable>>

export const useTableUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<TableUpdateData, ResponseError, TableUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableUpdateData, ResponseError, TableUpdateVariables>({
    mutationFn: (vars) => updateTable(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, schema, id } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tableEditorKeys.tableEditor(projectRef, id) }),
        queryClient.invalidateQueries({ queryKey: tableKeys.list(projectRef, schema) }),
        queryClient.invalidateQueries({ queryKey: lintKeys.lint(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update database table: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
